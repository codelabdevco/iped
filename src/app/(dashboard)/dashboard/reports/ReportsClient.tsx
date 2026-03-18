"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface Props {
  monthly: { income: number[]; expense: number[]; savings: number[] };
  categories: { name: string; amount: number; pct: number; count: number }[];
  topMerchants: { name: string; total: number; count: number }[];
  topPayments: { method: string; total: number; count: number }[];
  comparison: { thisMonth: { income: number; expense: number; savings: number }; lastMonth: { income: number; expense: number } };
}

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const CAT_COLORS = ["#FB923C", "#60A5FA", "#F472B6", "#34D399", "#A78BFA", "#FBBF24", "#94A3B8", "#F87171", "#22D3EE", "#E879F9"];
const PM_LABEL: Record<string, string> = { cash: "เงินสด", promptpay: "พร้อมเพย์", transfer: "โอน", credit: "เครดิต", debit: "เดบิต", "bank-scb": "SCB", "bank-kbank": "KBank", "bank-bbl": "BBL", "bank-ktb": "KTB", other: "อื่นๆ" };

function fmt(n: number) { return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`; }

export default function ReportsClient({ monthly, categories, topMerchants, topPayments, comparison }: Props) {
  const { isDark } = useTheme();
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const { thisMonth, lastMonth } = comparison;
  const net = thisMonth.income - thisMonth.expense;
  const maxBar = Math.max(...monthly.income, ...monthly.expense, ...monthly.savings, 1);
  const incChg = lastMonth.income > 0 ? ((thisMonth.income - lastMonth.income) / lastMonth.income * 100) : 0;
  const expChg = lastMonth.expense > 0 ? ((thisMonth.expense - lastMonth.expense) / lastMonth.expense * 100) : 0;
  const pmMax = Math.max(...topPayments.map((p) => p.total), 1);

  return (
    <div className="space-y-6">
      <PageHeader title="สรุป & Trend" description="วิเคราะห์รายรับ รายจ่าย เงินออม" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="รายรับเดือนนี้" value={fmt(thisMonth.income)} icon={<TrendingUp size={20} />} color="text-green-500" change={incChg !== 0 ? `${incChg >= 0 ? "↗" : "↘"} ${Math.abs(incChg).toFixed(0)}%` : undefined} />
        <StatsCard label="รายจ่ายเดือนนี้" value={fmt(thisMonth.expense)} icon={<TrendingDown size={20} />} color="text-[#FA3633]" change={expChg !== 0 ? `${expChg >= 0 ? "↗" : "↘"} ${Math.abs(expChg).toFixed(0)}%` : undefined} />
        <StatsCard label="คงเหลือสุทธิ" value={fmt(net)} icon={<Wallet size={20} />} color={net >= 0 ? "text-green-500" : "text-red-500"} />
        <StatsCard label="เงินออมเดือนนี้" value={fmt(thisMonth.savings)} icon={<PiggyBank size={20} />} color="text-pink-500" />
      </div>

      {/* Monthly bar chart */}
      <div className={`${card} border ${border} rounded-2xl p-6`}>
        <h3 className={`font-semibold ${txt} mb-1`}>แนวโน้มรายเดือน</h3>
        <p className={`text-xs ${sub} mb-5`}>12 เดือนย้อนหลัง</p>
        <div className="flex items-end gap-1.5 h-44">
          {MONTHS.map((m, i) => {
            const inc = monthly.income[i] || 0;
            const exp = monthly.expense[i] || 0;
            const sav = monthly.savings[i] || 0;
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-px w-full h-36">
                  <div className="flex-1 rounded-t bg-green-500/70" style={{ height: `${(inc / maxBar) * 100}%`, minHeight: inc > 0 ? 3 : 0 }} title={`รายรับ ${fmt(inc)}`} />
                  <div className="flex-1 rounded-t bg-red-500/60" style={{ height: `${(exp / maxBar) * 100}%`, minHeight: exp > 0 ? 3 : 0 }} title={`รายจ่าย ${fmt(exp)}`} />
                  <div className="flex-1 rounded-t bg-pink-500/50" style={{ height: `${(sav / maxBar) * 100}%`, minHeight: sav > 0 ? 3 : 0 }} title={`เงินออม ${fmt(sav)}`} />
                </div>
                <span className={`text-[9px] ${muted}`}>{m}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-5 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-500/70" /><span className={`text-[10px] ${sub}`}>รายรับ</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500/60" /><span className={`text-[10px] ${sub}`}>รายจ่าย</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-pink-500/50" /><span className={`text-[10px] ${sub}`}>เงินออม</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className={`${card} border ${border} rounded-2xl p-6`}>
          <h3 className={`font-semibold ${txt} mb-1`}>สัดส่วนรายจ่าย</h3>
          <p className={`text-xs ${sub} mb-4`}>เดือนนี้ แยกตามหมวดหมู่</p>
          {categories.length === 0 ? <p className={`text-sm ${muted}`}>ยังไม่มีข้อมูล</p> : (
            <div className="space-y-2.5">
              {categories.map((cat, i) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      <span className={`text-xs ${txt}`}>{cat.name}</span>
                    </div>
                    <span className={`text-xs font-medium ${txt}`}>{fmt(cat.amount)} <span className={`${muted}`}>({cat.pct}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top stores + payments */}
        <div className="space-y-4">
          <div className={`${card} border ${border} rounded-2xl p-6`}>
            <h3 className={`font-semibold ${txt} mb-3`}>ร้านค้า Top 5</h3>
            {topMerchants.length === 0 ? <p className={`text-sm ${muted}`}>ยังไม่มีข้อมูล</p> : (
              <div className="space-y-2.5">
                {topMerchants.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}>{i + 1}</span>
                    <span className={`text-xs flex-1 truncate ${txt}`}>{s.name}</span>
                    <span className={`text-[10px] ${muted}`}>{s.count} ครั้ง</span>
                    <span className={`text-xs font-semibold ${txt}`}>{fmt(s.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${card} border ${border} rounded-2xl p-6`}>
            <h3 className={`font-semibold ${txt} mb-3`}>วิธีจ่ายเดือนนี้</h3>
            {topPayments.length === 0 ? <p className={`text-sm ${muted}`}>ยังไม่มีข้อมูล</p> : (
              <div className="space-y-2">
                {topPayments.map((p) => (
                  <div key={p.method} className="flex items-center gap-2.5">
                    <BrandIcon brand={p.method} size={18} />
                    <span className={`text-xs flex-1 ${txt}`}>{PM_LABEL[p.method] || p.method}</span>
                    <div className="w-20 h-1.5 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full bg-[#FA3633]/60" style={{ width: `${(p.total / pmMax) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${txt} w-24 text-right`}>{fmt(p.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Month comparison */}
      <div className={`${card} border ${border} rounded-2xl p-6`}>
        <h3 className={`font-semibold ${txt} mb-4`}>เปรียบเทียบกับเดือนที่แล้ว</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "รายรับ", now: thisMonth.income, prev: lastMonth.income, chg: incChg, good: incChg >= 0 },
            { label: "รายจ่าย", now: thisMonth.expense, prev: lastMonth.expense, chg: expChg, good: expChg <= 0 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.good ? "bg-green-500/15" : "bg-red-500/15"}`}>
                {item.good ? <ArrowUpRight className="text-green-500" size={22} /> : <ArrowDownRight className="text-red-500" size={22} />}
              </div>
              <div>
                <p className={`text-xs ${sub}`}>{item.label}</p>
                <p className={`text-lg font-bold ${txt}`}>{item.chg >= 0 ? "+" : ""}{item.chg.toFixed(1)}%</p>
                <p className={`text-[11px] ${muted}`}>{fmt(item.prev)} → {fmt(item.now)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
