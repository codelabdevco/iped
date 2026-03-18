"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { CreditCard, Check, Star } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

interface PlanDisplay {
  _id: string;
  name: string;
  tier: string;
  priceMonthly: number;
  features: string[];
  isPopular: boolean;
  isCurrent: boolean;
}

interface BillingClientProps {
  currentPackageName: string;
  currentPackagePrice: number;
  packageExpiry: string | null;
  plans: PlanDisplay[];
}

export default function BillingClient({ currentPackageName, currentPackagePrice, packageExpiry, plans }: BillingClientProps) {
  const { isDark } = useTheme();
  const card = `rounded-xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;
  const sub = isDark ? "text-white/50" : "text-gray-500";

  return (
    <div className="space-y-6">
      <PageHeader title="Package & Billing" description="จัดการแพ็กเกจและการชำระเงิน" />

      {/* Current package banner */}
      <div className={`${card} flex items-center gap-4`}>
        <div className="p-3 rounded-xl bg-blue-500/10"><Star size={24} className="text-blue-400" /></div>
        <div>
          <p className={sub}>แพ็กเกจปัจจุบัน</p>
          <p className="text-xl font-bold">
            {currentPackageName} — ฿{currentPackagePrice.toLocaleString()}/เดือน
          </p>
          {packageExpiry && (
            <p className={`text-sm ${sub}`}>หมดอายุ: {packageExpiry}</p>
          )}
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p._id} className={`${card} ${p.isCurrent ? "ring-2 ring-blue-500" : ""}`}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold">{p.name}</h3>
              {p.isPopular && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 font-medium">แนะนำ</span>
              )}
            </div>
            <p className="text-2xl font-bold mb-4">
              ฿{p.priceMonthly.toLocaleString()}
              <span className={`text-sm font-normal ${sub}`}>/เดือน</span>
            </p>
            <ul className="space-y-2 mb-4">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-green-400 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2 rounded-lg text-sm font-medium ${
                p.isCurrent
                  ? "bg-blue-500 text-white"
                  : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
              }`}
            >
              {p.isCurrent ? "แพ็กเกจปัจจุบัน" : "เลือกแพ็กเกจ"}
            </button>
          </div>
        ))}
      </div>

      {/* Payment method (static placeholder) */}
      <div className={card}>
        <div className="flex items-center gap-3 mb-4">
          <CreditCard size={18} className="text-blue-400" />
          <span className="font-semibold">วิธีชำระเงิน</span>
          <span className={`text-sm ${sub}`}>Visa **** 4242</span>
        </div>
      </div>
    </div>
  );
}
