"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Building2, Check, X, Loader2, UserPlus } from "lucide-react";

export default function JoinPage() {
  const params = useParams();
  const code = params.code as string;
  const [status, setStatus] = useState<"loading" | "joining" | "success" | "already" | "error">("loading");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    joinOrg();
  }, []);

  async function joinOrg() {
    try {
      setStatus("joining");
      const res = await fetch("/api/org/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();

      if (res.ok) {
        setOrgName(data.orgName || "บริษัท");
        setStatus(data.already ? "already" : "success");
      } else if (res.status === 401) {
        // Not logged in — redirect to login then come back
        window.location.href = `/login?redirect=/join/${code}`;
      } else {
        setError(data.error || "รหัสเชิญไม่ถูกต้อง");
        setStatus("error");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 50%, #FFF0F0 100%)" }}>
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full overflow-hidden">
        <div className="h-2" style={{ backgroundColor: "#FA3633" }} />
        <div className="p-8 text-center">
          <img src="/logo-cropped.png" alt="อาซิ่ม" className="w-16 h-16 rounded-2xl mx-auto mb-5 object-cover shadow-sm" />

          {(status === "loading" || status === "joining") && (
            <>
              <Loader2 size={32} className="text-[#FA3633] animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-800">กำลังเข้าร่วมบริษัท...</h2>
              <p className="text-sm text-gray-400 mt-1">รหัสเชิญ: {code}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">เข้าร่วมสำเร็จ!</h2>
              <p className="text-sm text-gray-500 mt-1">คุณเข้าร่วม <span className="font-semibold text-gray-800">{orgName}</span> แล้ว</p>
              <p className="text-xs text-gray-400 mt-3">ส่งสลิปมาที่ LINE @315ilalq แล้วกด "ส่งเข้าบริษัท" ได้เลย</p>
              <div className="mt-6 space-y-2">
                <a href="/m/liff" className="block w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: "#06C755" }}>
                  เปิดแอปมือถือ
                </a>
                <a href="/dashboard" className="block w-full py-3 rounded-xl text-gray-600 font-medium text-sm bg-gray-100">
                  ไปหน้า Dashboard
                </a>
              </div>
            </>
          )}

          {status === "already" && (
            <>
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Building2 size={28} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">คุณเป็นสมาชิกอยู่แล้ว</h2>
              <p className="text-sm text-gray-500 mt-1">คุณเป็นสมาชิก <span className="font-semibold text-gray-800">{orgName}</span> อยู่แล้ว</p>
              <div className="mt-6">
                <a href="/dashboard" className="block w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: "#FA3633" }}>
                  ไปหน้า Dashboard
                </a>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <X size={28} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">ไม่สามารถเข้าร่วมได้</h2>
              <p className="text-sm text-red-500 mt-1">{error}</p>
              <div className="mt-6 space-y-2">
                <button onClick={joinOrg} className="block w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: "#FA3633" }}>
                  ลองใหม่
                </button>
                <a href="/login" className="block w-full py-3 rounded-xl text-gray-600 font-medium text-sm bg-gray-100">
                  เข้าสู่ระบบ
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
