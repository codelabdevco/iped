"use client";

import { useTheme } from "@/contexts/ThemeContext";

interface ReportsData {
  categories: { name: string; icon: string; total: number; count: number }[];
  monthlyData: { month: string; expense: number; income: number }[];
  totalExpense: number;
}

export default function MobileReportsClient({ data }: { data: ReportsData }) {
  const { isDark } = useTheme();

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 0 });
  const maxMonthly = Math.max(...data.monthlyData.map((m) => Math.max(m.expense, m.income)), 1);
  const maxCat = Math.max(...data.categories.map((c) => c.total), 1);

  return (
    <div className="space-y-4 pt-2">
      <p className={`text-lg font-bold ${txt}`}>สรุป & Trend</p>

      {/* Monthly bar chart */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${sub} mb-4`}>รายจ่าย 6 เดือนล่าสุด</p>
        <div className="flex items-end justify-between gap-2 h-32">
          {data.monthlyData.map((m) => {
            const expH = (m.expense / maxMonthly) * 100;
            const incH = (m.income / maxMonthly) * 100;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-0.5 h-24">
                  <div className="w-3 rounded-t bg-red-500/70" style={{ height: `${Math.max(2, expH)}%` }} />
                  {m.income > 0 && <div className="w-3 rounded-t bg-green-500/70" style={{ height: `${Math.max(2, incH)}%` }} />}
                </div>
                <span className={`text-[9px] ${muted}`}>{m.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500/70" /><span className={`text-[10px] ${muted}`}>รายจ่าย</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-green-500/70" /><span className={`text-[10px] ${muted}`}>รายรับ</span></div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${sub} mb-3`}>หมวดหมู่ (เดือนนี้)</p>
        <div className="space-y-3">
          {data.categories.map((c) => {
            const pct = (c.total / maxCat) * 100;
            const ofTotal = data.totalExpense > 0 ? Math.round((c.total / data.totalExpense) * 100) : 0;
            return (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${txt}`}>{c.icon} {c.name}</span>
                  <span className={`text-xs font-bold ${txt}`}>฿{fmt(c.total)} <span className={`font-normal ${muted}`}>({ofTotal}%)</span></span>
                </div>
                <div className={`h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                  <div className="h-full rounded-full bg-[#FA3633]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {data.categories.length === 0 && <p className={`text-center text-sm py-6 ${sub}`}>ยังไม่มีข้อมูลเดือนนี้</p>}
        </div>
      </div>
    </div>
  );
}
