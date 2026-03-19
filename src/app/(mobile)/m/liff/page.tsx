"use client";

import { useEffect, useState } from "react";

export default function LiffPage() {
  const [status, setStatus] = useState("กำลังเชื่อมต่อ LINE...");
  const [error, setError] = useState("");

  useEffect(() => {
    initLiff();
  }, []);

  async function initLiff() {
    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        setError("LIFF ID ไม่ถูกต้อง");
        return;
      }

      // Load LIFF SDK
      const liff = (await import("@line/liff")).default;
      await liff.init({ liffId });

      // Not logged in → redirect to LINE login
      if (!liff.isLoggedIn()) {
        setStatus("กำลังเข้าสู่ระบบ LINE...");
        liff.login({ redirectUri: window.location.href });
        return;
      }

      setStatus("กำลังดึงข้อมูลโปรไฟล์...");

      // Get LINE access token
      const accessToken = liff.getAccessToken();
      if (!accessToken) {
        setError("ไม่สามารถดึง token ได้");
        return;
      }

      // Send to our API to create session
      setStatus("กำลังเข้าสู่ระบบ...");
      const res = await fetch("/api/auth/line/liff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      if (res.ok) {
        // Session created → redirect to /m
        window.location.href = "/m";
      } else {
        const data = await res.json();
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (err: any) {
      console.error("LIFF error:", err);
      setError(err.message || "เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a]">
      <div className="text-center">
        <img src="/logo-cropped.png" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover" />
        {error ? (
          <>
            <p className="text-red-400 text-sm font-medium mb-2">{error}</p>
            <button onClick={() => { setError(""); initLiff(); }} className="px-6 py-2 rounded-xl bg-[#FA3633] text-white text-sm font-medium">
              ลองใหม่
            </button>
          </>
        ) : (
          <>
            <div className="w-6 h-6 border-2 border-[#FA3633] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/60 text-sm">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}
