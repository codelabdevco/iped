"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { ScanLine, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import BrandIcon from "@/components/dashboard/BrandIcon";
import { formatNumber as fmt } from "@/lib/utils";

interface HomeData {
  displayName: string;
  todayExpense: number;
  todayIncome: number;
  todayCount: number;
  monthExpense: number;
  monthIncome: number;
  monthlyBudget: number;
  recentReceipts: {
    _id: string;
    merchant: string;
    amount: number;
    category: string;
    categoryIcon: string;
    direction: string;
    paymentMethod: string;
    date: string;
    time: string;
    status: string;
    hasImage: boolean;
  }[];
}

export default function MobileHomeClient({ data }: { data: HomeData }) {
  const { isDark } = useTheme();

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const budgetPct = data.monthlyBudget > 0 ? Math.min(100, (data.monthExpense / data.monthlyBudget) * 100) : 0;

  return (
    <div className="space-y-4 pt-2">
      {/* Greeting */}
      <div>
        <p className={`text-lg font-bold ${txt}`}>สวัสดี, {data.displayName.split(" ")[0]} 👋</p>
        <p className={`text-xs ${sub}`}>{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Today summary card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#FA3633] to-[#ff6b6b] p-5 text-white">
        <p className="text-xs text-white/70">วันนี้</p>
        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="text-3xl font-bold">฿{fmt(data.todayExpense)}</p>
            <p className="text-xs text-white/60 mt-1">{data.todayCount} รายการ</p>
          </div>
          {data.todayIncome > 0 && (
            <div className="text-right">
              <p className="text-xs text-white/60">รายรับ</p>
              <p className="text-lg font-bold">+฿{fmt(data.todayIncome)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick scan button */}
      <a href="/m/scan" className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#FA3633] text-white font-semibold text-sm shadow-lg active:scale-[0.98] transition-transform">
        <ScanLine size={20} />
        สแกนใบเสร็จ
      </a>

      {/* Month summary */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${sub} mb-3`}>เดือนนี้</p>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-3 ${isDark ? "bg-red-500/10" : "bg-red-50"}`}>
            <p className="text-[10px] text-red-500">รายจ่าย</p>
            <p className="text-base font-bold text-red-500">฿{fmt(data.monthExpense)}</p>
          </div>
          <div className={`rounded-xl p-3 ${isDark ? "bg-green-500/10" : "bg-green-50"}`}>
            <p className="text-[10px] text-green-500">รายรับ</p>
            <p className="text-base font-bold text-green-500">฿{fmt(data.monthIncome)}</p>
          </div>
        </div>
        {data.monthlyBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className={`text-[10px] ${muted}`}>งบประมาณ</span>
              <span className={`text-[10px] font-medium ${budgetPct > 80 ? "text-red-500" : sub}`}>{Math.round(budgetPct)}%</span>
            </div>
            <div className={`h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
              <div className={`h-full rounded-full ${budgetPct > 80 ? "bg-red-500" : "bg-[#FA3633]"}`} style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Recent receipts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-semibold ${txt}`}>รายการล่าสุด</p>
          <a href="/m/receipts" className="text-xs text-[#FA3633]">ดูทั้งหมด</a>
        </div>
        <div className="space-y-2">
          {data.recentReceipts.map((r) => {
            const isIncome = r.direction === "income";
            return (
              <div key={r._id} className={`${card} border ${border} rounded-xl px-4 py-3 flex items-center gap-3`}>
                {r.paymentMethod && r.paymentMethod.startsWith("bank-") ? (
                  <BrandIcon brand={r.paymentMethod} size={36} className="rounded-lg" />
                ) : (
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                    {r.categoryIcon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${txt} truncate`}>{r.merchant}</p>
                  <p className={`text-[10px] ${muted}`}>{r.date} {r.time && `· ${r.time}`}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${isIncome ? "text-green-500" : txt}`}>
                    {isIncome ? "+" : "-"}฿{fmt(r.amount)}
                  </p>
                  <p className={`text-[10px] ${muted}`}>{r.category}</p>
                </div>
              </div>
            );
          })}
          {data.recentReceipts.length === 0 && (
            <div className={`text-center py-8 ${sub}`}>
              <p className="text-sm">ยังไม่มีรายการ</p>
              <p className="text-xs mt-1">ส่งสลิปผ่าน LINE หรือกดสแกน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
