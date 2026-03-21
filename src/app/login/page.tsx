'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ScanLine, Receipt, BarChart3, Shield } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [loading, setLoading] = useState(false);

  const handleLineLogin = () => {
    setLoading(true);
    window.location.href = '/api/auth/line/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, #FA3633, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          {/* Brand bar */}
          <div className="h-1.5" style={{ backgroundColor: '#FA3633' }} />

          <div className="p-8">
            {/* Logo + Title */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <img src="/logo-cropped.png" alt="อาซิ่ม" className="w-20 h-20 rounded-2xl mx-auto object-cover ring-2 ring-white/[0.08]" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FA3633' }}>
                  <ScanLine size={12} className="text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mt-5 leading-none">อาซิ่ม</h1>
              <p className="text-white/40 text-sm mt-1.5">ระบบจัดการใบเสร็จอัจฉริยะ</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 text-center">
                <p className="text-red-400 text-sm">
                  {error === 'auth_failed' ? 'การเข้าสู่ระบบล้มเหลว' :
                   error === 'token_failed' ? 'ไม่สามารถยืนยันตัวตนได้' :
                   error === 'profile_failed' ? 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้' :
                   error === 'line_only' ? 'กรุณาเข้าสู่ระบบผ่าน LINE' :
                   'เกิดข้อผิดพลาด กรุณาลองใหม่'}
                </p>
              </div>
            )}

            {/* LINE Login Button */}
            <button
              onClick={handleLineLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#06C755' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              {loading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย LINE'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] text-white/20 uppercase tracking-wider">ใช้งานฟรี</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: ScanLine, label: "AI สแกนสลิป" },
                { icon: Receipt, label: "จัดการใบเสร็จ" },
                { icon: BarChart3, label: "สรุปรายจ่าย" },
                { icon: Shield, label: "ปลอดภัย 100%" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                  <f.icon size={14} className="text-[#FA3633] shrink-0" />
                  <span className="text-[11px] text-white/50">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/15 text-[10px] text-center mt-6 tracking-wide uppercase">Powered by codelabs tech</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
