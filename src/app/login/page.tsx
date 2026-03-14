"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [isDemo, setIsDemo] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoPassword, setDemoPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLineLogin = () => {
    window.location.href = "/api/auth/line/login";
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/";
      } else {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-black font-black text-2xl">iP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">iPED</h1>
          <p className="text-sm text-muted-foreground mt-1">ระบบจัดการใบเสร็จอัจฉริยะ</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-base">เข้าสู่ระบบ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* LINE Login */}
            <Button
              className="w-full bg-[#06C755] hover:bg-[#05b34d] text-white font-medium py-5"
              onClick={handleLineLogin}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              เข้าสู่ระบบด้วย LINE
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-muted-foreground">หรือ</span>
              </div>
            </div>

            {!isDemo ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsDemo(true)}
              >
                เข้าสู่ระบบด้วย Email (Demo)
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={demoPassword}
                  onChange={(e) => setDemoPassword(e.target.value)}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  className="w-full"
                  onClick={handleDemoLogin}
                  disabled={loading}
                >
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
              </div>
            )}

            {/* Demo Access */}
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                className="w-full text-sm text-muted-foreground"
                onClick={() => (window.location.href = "/")}
              >
                ดูตัวอย่างระบบ (Demo Mode) →
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-4">
          iPED — AI-Powered Expense & Document Manager
        </p>
      </div>
    </div>
  );
}
