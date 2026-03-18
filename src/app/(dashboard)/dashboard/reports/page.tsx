"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { BarChart3, TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const incomeData = [42000, 48000, 66100, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const expenseData = [28500, 35200, 21660, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const catBreakdown = [
  { name: "อาหาร", amount: 5250, pct: 24.3, color: "#FB923C" },
  { name: "เดินทาง", amount: 4800, pct: 22.2, color: "#60A5FA" },
  { name: "สาธารณูปโภค", amount: 3170, pct: 14.6, color: "#F472B6" },
  { name: "สุขภาพ", amount: 3500, pct: 16.2, color: "#34D399" },
  { name: "ช้อปปิ้ง", amount: 2490, pct: 11.5, color: "#A78BFA" },
  { name: "บันเทิง", amount: 1200, pct: 5.5, color: "#FBBF24" },
  { name: "อื่นๆ", amount: 1250, pct: 5.8, color: "#94A3B8" },
];

const topStores = [
  { name: "Tops Market สาขาสีลม", count: 8, total: 4200 },
  { name: "7-Eleven", count: 12, total: 2100 },
  { name: "BTS สายสีเขียว", count: 22, total: 1540 },
  { name: "Grab Food", count: 6, total: 1850 },
  { name: "Shell ปั๊มน้ำมัน", count: 3, total: 4500 },
];

export default function ReportsPage() {
  const { isDark } = useTheme();
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const thisMonthIncome = incomeData[2];
  const lastMonthIncome = incomeData[1];
  const thisMonthExpense = expenseData[2];
  const lastMonthExpense = expenseData[1];
  const net = thisMonthIncome - thisMonthExpense;
  const incomeChange = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : "0";
  const expenseChange = lastMonthExpense > 0 ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1) : "0";

  const maxBar = Math.max(...incomeData, ...expenseData, 1);

  return (
    <div className="space-y-6">
      <PageHeader title="สรุป & Trend" description="วิเคราะห์และสรุปรายจ่ายรายรับของคุณ" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="รายรับเดือนนี้" value={`฿${thisMonthIncome.toLocaleString()}`} icon={<TrendingUp size={20} />} color="text-green-500" />
        <StatsCard label="รายจ่ายเดือนนี้" value={`฿${thisMonthExpense.toLocaleString()}`} icon={<TrendingDown size={20} />} color="text-red-500" />
        <StatsCard label="คงเหลือสุทธิ" value={`฿${net.toLocaleString()}`} icon={<Wallet size={20} />} color={net >= 0 ? "text-green-500" : "text-red-500"} />
        <StatsCard label="อัตราออม" value={`${thisMonthIncome > 0 ? ((net / thisMonthIncome) * 100).toFixed(1) : 0}%`} icon={<PieChart size={20} />} color="text-blue-500" />
      </div>

      {/* Monthly Trend Chart */}
      <div className={`${card} border ${border} rounded-2xl p-6`}>
        <h3 className={`font-semibold ${txt} mb-1`}>แนวโน้มรายเดือน</h3>
        <p className={`text-sm ${sub} mb-6`}>รายรับ vs รายจ่าย 12 เดือนย้อนหลัง</p>
        <div className="flex items-end gap-2 h-48">
          {months.map((m, i) => {
            const inc = incomeData[i];
            const exp = expenseData[i];
            const incH = maxBar > 0 ? (inc / maxBar) * 100 : 0;
            const expH = maxBar > 0 ? (exp / maxBar) * 100 : 0;
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 w-full h-40">
                  <div className="flex-1 rounded-t-md bg-green-500/80 transition-all duration-500" style={{ height: `${incH}%`, minHeight: inc > 0 ? 4 : 0 }} />
                  <div className="flex-1 rounded-t-md bg-red-500/60 transition-all duration-500" style={{ height: `${expH}%`, minHeight: exp > 0 ? 4 : 0 }} />
                </div>
                <span className={`text-[10px] ${sub}`}>{m}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-500/80" /><span className={`text-xs ${sub}`}>รายรับ</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500/60" /><span className={`text-xs ${sub}`}>รายจ่าย</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className={`${card} border ${border} rounded-2xl p-6`}>
          <h3 className={`font-semibold ${txt} mb-1`}>สัดส่วนรายจ่ายตามหมวดหมู่</h3>
          <p className={`text-sm ${sub} mb-5`}>เดือนมีนาคม 2569</p>
          <div className="space-y-3">
            {catBreakdown.map(cat => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${txt}`}>{cat.name}</span>
                  <span className={`text-sm font-medium ${txt}`}>฿{cat.amount.toLocaleString()} <span className={`text-xs ${sub}`}>({cat.pct}%)</span></span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Stores */}
        <div className={`${card} border ${border} rounded-2xl p-6`}>
          <h3 className={`font-semibold ${txt} mb-1`}>ร้านที่ใช้จ่ายบ่อย</h3>
          <p className={`text-sm ${sub} mb-5`}>Top 5 เดือนนี้</p>
          <div className="space-y-4">
            {topStores.map((store, i) => (
              <div key={store.name} className="flex items-center gap-4">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${txt} truncate`}>{store.name}</p>
                  <p className={`text-xs ${sub}`}>{store.count} ครั้ง</p>
                </div>
                <span className={`text-sm font-semibold ${txt}`}>฿{store.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month over month */}
      <div className={`${card} border ${border} rounded-2xl p-6`}>
        <h3 className={`font-semibold ${txt} mb-4`}>เปรียบเทียบกับเดือนที่แล้ว</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${Number(incomeChange) >= 0 ? "bg-green-500/15" : "bg-red-500/15"}`}>
              {Number(incomeChange) >= 0 ? <ArrowUpRight className="text-green-500" size={24} /> : <ArrowDownRight className="text-red-500" size={24} />}
            </div>
            <div>
              <p className={`text-sm ${sub}`}>รายรับ</p>
              <p className={`text-xl font-bold ${txt}`}>{Number(incomeChange) >= 0 ? "+" : ""}{incomeChange}%</p>
              <p className={`text-xs ${sub}`}>฿{lastMonthIncome.toLocaleString()} → ฿{thisMonthIncome.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${Number(expenseChange) <= 0 ? "bg-green-500/15" : "bg-red-500/15"}`}>
              {Number(expenseChange) <= 0 ? <ArrowDownRight className="text-green-500" size={24} /> : <ArrowUpRight className="text-red-500" size={24} />}
            </div>
            <div>
              <p className={`text-sm ${sub}`}>รายจ่าย</p>
              <p className={`text-xl font-bold ${txt}`}>{Number(expenseChange) >= 0 ? "+" : ""}{expenseChange}%</p>
              <p className={`text-xs ${sub}`}>฿{lastMonthExpense.toLocaleString()} → ฿{thisMonthExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
