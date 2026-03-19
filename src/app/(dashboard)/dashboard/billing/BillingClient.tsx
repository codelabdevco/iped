"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Crown, Zap, Check, ArrowUpRight, CreditCard, Calendar, BarChart3 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import Link from "next/link";

interface PlanDisplay {
  _id: string;
  name: string;
  tier: string;
  type: string;
  priceMonthly: number;
  priceYearly: number;
  limits: any;
  isPopular: boolean;
  isCurrent: boolean;
}

interface UserPlan {
  plan: string;
  planName: string;
  type: string;
  limits: any;
  features: any;
  subscription: any;
  usage: {
    receipts: number;
    ocr: number;
    storageBytes: number;
    gmailScans: number;
    transfers: number;
    aiChats: number;
  };
}

function UsageBar({ label, current, limit, color }: { label: string; current: number; limit: number; color: string }) {
  const pct = limit <= 0 ? 0 : limit === -1 ? 5 : Math.min((current / limit) * 100, 100);
  const isUnlimited = limit === -1;
  const isOver = !isUnlimited && limit > 0 && current >= limit;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className={isOver ? "text-red-400 font-bold" : ""}>{current.toLocaleString()}{isUnlimited ? "" : ` / ${limit.toLocaleString()}`}{isUnlimited ? " (ไม่จำกัด)" : ""}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : color}`} style={{ width: `${isUnlimited ? 5 : pct}%` }} />
      </div>
    </div>
  );
}

const tierColors: Record<string, string> = {
  free: "text-gray-400",
  plus: "text-blue-400",
  pro: "text-purple-400",
  starter: "text-teal-400",
  business: "text-orange-400",
  enterprise: "text-red-400",
};

const tierBg: Record<string, string> = {
  free: "bg-gray-500/10",
  plus: "bg-blue-500/10",
  pro: "bg-purple-500/10",
  starter: "bg-teal-500/10",
  business: "bg-orange-500/10",
  enterprise: "bg-red-500/10",
};

export default function BillingClient({ plan, plans }: { plan: UserPlan; plans: PlanDisplay[] }) {
  const { isDark } = useTheme();
  const c = (d: string, l: string) => (isDark ? d : l);
  const card = c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200");
  const txt = c("text-white", "text-gray-900");
  const sub = c("text-white/50", "text-gray-500");
  const muted = c("text-white/30", "text-gray-400");

  const limits = plan.limits || {};
  const usage = plan.usage;
  const isFree = plan.plan === "free";
  const subInfo = plan.subscription;

  // Filter plans by same type
  const samePlans = plans.filter((p) => p.type === plan.type || p.type === "personal");

  return (
    <div className="space-y-6">
      <PageHeader title="Package & Billing" description="จัดการแพ็กเกจและการชำระเงิน" />

      {/* Current Plan */}
      <div className={`${card} border rounded-2xl p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tierBg[plan.plan]}`}>
              <Crown size={24} className={tierColors[plan.plan]} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-bold ${txt}`}>{plan.planName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tierBg[plan.plan]} ${tierColors[plan.plan]}`}>{plan.plan.toUpperCase()}</span>
              </div>
              {subInfo ? (
                <p className={`text-xs ${sub}`}>
                  {subInfo.status === "trial" ? "ทดลองใช้" : subInfo.billingCycle === "yearly" ? "รายปี" : "รายเดือน"}
                  {subInfo.currentPeriodEnd && ` • หมดอายุ ${new Date(subInfo.currentPeriodEnd).toLocaleDateString("th-TH")}`}
                </p>
              ) : (
                <p className={`text-xs ${sub}`}>แพ็กเกจปัจจุบัน</p>
              )}
            </div>
          </div>
          <Link href="/pricing" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors">
            <Zap size={16} />{isFree ? "อัพเกรด" : "เปลี่ยนแพ็กเกจ"}
          </Link>
        </div>
      </div>

      {/* Usage */}
      <div className={`${card} border rounded-2xl p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className={tierColors[plan.plan]} />
          <h3 className={`text-sm font-bold ${txt}`}>การใช้งานเดือนนี้</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageBar label="ใบเสร็จ" current={usage.receipts} limit={limits.receiptsPerMonth ?? limits.documentsPerMonth ?? 30} color="bg-blue-500" />
          <UsageBar label="OCR สแกน" current={usage.ocr} limit={limits.ocrPerMonth ?? 10} color="bg-purple-500" />
          <UsageBar label="พื้นที่ (MB)" current={Math.round(usage.storageBytes / 1048576)} limit={limits.storageBytes ? Math.round(limits.storageBytes / 1048576) : 100} color="bg-teal-500" />
          <UsageBar label="ส่งเบิกจ่าย" current={usage.transfers} limit={limits.transferPerMonth ?? 0} color="bg-orange-500" />
          {(limits.aiChatPerMonth ?? 0) !== 0 && <UsageBar label="AI Chat" current={usage.aiChats} limit={limits.aiChatPerMonth} color="bg-pink-500" />}
          {(limits.gmailAccounts ?? 0) !== 0 && <UsageBar label="Gmail Scan" current={usage.gmailScans} limit={limits.gmailAccounts} color="bg-green-500" />}
        </div>
      </div>

      {/* Quick upgrade cards */}
      {isFree && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.filter((p) => p.tier === "plus" || p.tier === "pro").map((p) => (
            <div key={p.tier} className={`${card} border rounded-2xl p-5 ${p.isPopular ? "ring-2 ring-[#FA3633]/30" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className={`font-bold ${txt}`}>{p.name}</h3>
                  <p className={`text-xs ${sub}`}>
                    ฿{p.priceMonthly.toLocaleString()}/เดือน
                    {p.priceYearly > 0 && <span className={muted}> • ฿{p.priceYearly.toLocaleString()}/ปี</span>}
                  </p>
                </div>
                {p.isPopular && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FA3633]/10 text-[#FA3633]">ยอดนิยม</span>}
              </div>
              <div className="space-y-1.5 mb-4">
                <p className={`text-xs ${sub}`}><Check size={12} className="inline text-green-400 mr-1" />{p.limits?.receiptsPerMonth === -1 ? "ไม่จำกัดใบเสร็จ" : `${p.limits?.receiptsPerMonth ?? p.limits?.documentsPerMonth} ใบเสร็จ/เดือน`}</p>
                <p className={`text-xs ${sub}`}><Check size={12} className="inline text-green-400 mr-1" />{p.limits?.ocrPerMonth === -1 ? "ไม่จำกัด OCR" : `${p.limits?.ocrPerMonth} OCR/เดือน`}</p>
                <p className={`text-xs ${sub}`}><Check size={12} className="inline text-green-400 mr-1" />Gmail + Google Drive</p>
              </div>
              <Link href="/pricing" className={`block w-full py-2.5 rounded-xl text-sm font-medium text-center transition-colors ${p.isPopular ? "bg-[#FA3633] text-white hover:bg-[#e0302d]" : c("bg-white/5 text-white/70 hover:bg-white/10", "bg-gray-100 text-gray-700 hover:bg-gray-200")}`}>
                อัพเกรดเป็น {p.name}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Subscription details */}
      {subInfo && (
        <div className={`${card} border rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className={sub} />
            <h3 className={`text-sm font-bold ${txt}`}>รายละเอียด Subscription</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className={`text-[10px] ${muted}`}>สถานะ</p>
              <p className={`text-sm font-medium ${subInfo.status === "active" ? "text-green-400" : subInfo.status === "trial" ? "text-blue-400" : "text-yellow-400"}`}>
                {subInfo.status === "active" ? "ใช้งาน" : subInfo.status === "trial" ? "ทดลอง" : subInfo.status}
              </p>
            </div>
            <div>
              <p className={`text-[10px] ${muted}`}>รอบบิล</p>
              <p className={`text-sm ${txt}`}>{subInfo.billingCycle === "yearly" ? "รายปี" : "รายเดือน"}</p>
            </div>
            <div>
              <p className={`text-[10px] ${muted}`}>หมดอายุ</p>
              <p className={`text-sm ${txt}`}>{subInfo.currentPeriodEnd ? new Date(subInfo.currentPeriodEnd).toLocaleDateString("th-TH") : "-"}</p>
            </div>
            <div>
              <p className={`text-[10px] ${muted}`}>ต่ออายุอัตโนมัติ</p>
              <p className={`text-sm ${subInfo.autoRenew ? "text-green-400" : "text-yellow-400"}`}>{subInfo.autoRenew ? "เปิด" : "ปิด"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Link to pricing */}
      <div className="text-center">
        <Link href="/pricing" className={`text-sm ${sub} hover:text-[#FA3633] transition-colors`}>
          ดูแพ็กเกจทั้งหมด →
        </Link>
      </div>
    </div>
  );
}
