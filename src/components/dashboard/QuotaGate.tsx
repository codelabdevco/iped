"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

// Usage: <QuotaGate feature="gmail" plan="free" fallback={<UpgradePrompt />}>{children}</QuotaGate>
// Or: <QuotaGate allowed={false} message="หมดโควต้า">{children}</QuotaGate>

interface QuotaGateProps {
  allowed?: boolean;
  feature?: string;
  plan?: string;
  message?: string;
  children: React.ReactNode;
}

export default function QuotaGate({ allowed = true, message, children }: QuotaGateProps) {
  if (allowed) return <>{children}</>;

  // Show locked state
  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/80 backdrop-blur rounded-xl px-4 py-3 text-center max-w-xs">
          <Lock size={20} className="mx-auto text-[#FA3633] mb-2" />
          <p className="text-white text-sm font-medium">{message || "ฟีเจอร์นี้ต้องอัพเกรด"}</p>
          <Link href="/pricing" className="inline-block mt-2 px-4 py-1.5 rounded-lg bg-[#FA3633] text-white text-xs font-medium hover:bg-[#e0302d]">
            ดูแพ็กเกจ
          </Link>
        </div>
      </div>
    </div>
  );
}
