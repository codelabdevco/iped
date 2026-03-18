"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { CreditCard, Banknote, Smartphone, Building2, Wallet, Hash } from "lucide-react";
import BrandIcon from "@/components/dashboard/BrandIcon";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

interface PaymentItem { method: string; count: number; total: number; }

const METHOD_INFO: Record<string, { label: string; icon: string; color: string }> = {
  cash: { label: "เงินสด", icon: "💵", color: "#34D399" },
  promptpay: { label: "พร้อมเพย์", icon: "📱", color: "#6366f1" },
  transfer: { label: "โอนธนาคาร", icon: "🏦", color: "#F472B6" },
  credit: { label: "บัตรเครดิต", icon: "💳", color: "#818CF8" },
  debit: { label: "บัตรเดบิต", icon: "💳", color: "#60A5FA" },
  "bank-scb": { label: "SCB ไทยพาณิชย์", icon: "🟣", color: "#4C2B91" },
  "bank-kbank": { label: "KBank กสิกร", icon: "🟢", color: "#138F2D" },
  "bank-bbl": { label: "BBL กรุงเทพ", icon: "🔵", color: "#1E3A8A" },
  "bank-ktb": { label: "KTB กรุงไทย", icon: "🔵", color: "#0EA5E9" },
  "bank-bay": { label: "BAY กรุงศรี", icon: "🟡", color: "#EAB308" },
  "bank-tmb": { label: "TTB ทีเอ็มบี", icon: "🟠", color: "#F97316" },
  "bank-gsb": { label: "GSB ออมสิน", icon: "🩷", color: "#EC4899" },
  "ewallet-truemoney": { label: "TrueMoney", icon: "🔴", color: "#EF4444" },
  "ewallet-rabbit": { label: "Rabbit LINE Pay", icon: "🟢", color: "#06C755" },
  "ewallet-shopee": { label: "ShopeePay", icon: "🟠", color: "#EE4D2D" },
  other: { label: "อื่นๆ", icon: "📋", color: "#94A3B8" },
};

function getInfo(method: string) {
  return METHOD_INFO[method] || { label: method, icon: "📋", color: "#94A3B8" };
}

export default function PaymentsClient({ payments }: { payments: PaymentItem[] }) {
  const { isDark } = useTheme();
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";

  const total = payments.reduce((s, p) => s + p.total, 0);
  const totalCount = payments.reduce((s, p) => s + p.count, 0);
  const maxTotal = Math.max(...payments.map((p) => p.total), 1);

  return (
    <div className="space-y-6">
      <PageHeader title="วิธีจ่าย" description={`${payments.length} ช่องทาง · ${totalCount} รายการ`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ยอดทั้งหมด" value={`฿${total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Wallet size={20} />} color="text-blue-500" />
        <StatsCard label="ช่องทางที่ใช้" value={`${payments.length} ช่องทาง`} icon={<CreditCard size={20} />} color="text-purple-500" />
        <StatsCard label="รายการทั้งหมด" value={`${totalCount} รายการ`} icon={<Hash size={20} />} color="text-green-500" />
        <StatsCard label="ใช้บ่อยสุด" value={payments[0] ? getInfo(payments[0].method).label : "-"} icon={<Banknote size={20} />} color="text-orange-500" />
      </div>

      {payments.length === 0 ? (
        <div className={`${card} border ${border} rounded-2xl p-12 text-center ${sub}`}>ยังไม่มีข้อมูล — เริ่มเพิ่มใบเสร็จเพื่อดูวิธีจ่าย</div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => {
            const info = getInfo(p.method);
            const pct = (p.total / maxTotal) * 100;
            const pctOfTotal = total > 0 ? (p.total / total) * 100 : 0;
            return (
              <div key={p.method} className={`${card} border ${border} rounded-xl px-4 py-3.5 flex items-center gap-4`}>
                <BrandIcon brand={p.method} size={36} className="rounded-xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-medium ${txt}`}>{info.label}</span>
                    <span className={`text-sm font-semibold ${txt}`}>฿{p.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}<span className="text-[0.75em] opacity-50">{""}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: info.color, opacity: 0.7 }} />
                    </div>
                    <span className={`text-[10px] ${muted} w-20 text-right shrink-0`}>{p.count} รายการ · {pctOfTotal.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
