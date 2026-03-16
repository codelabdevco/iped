"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  TrendingUp,
  Receipt,
  Calculator,
  FolderOpen,
} from "lucide-react";

interface DashboardData {
  totalAmount: number;
  changePercent: number;
  receiptCount: number;
  avgPerReceipt: number;
  categoryCount: number;
  monthlyData: { month: string; categories: Record<string, number>; total: number }[];
  categoryData: Record<string, number>;
  recentReceipts: {
    _id: string;
    storeName: string;
    type: string;
    category: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "ช็อปปิ้ง": "#818CF8",
  "อาหาร": "#FB923C",
  "เดินทาง": "#60A5FA",
  "สาธารณูปโภค": "#F472B6",
  "ของใช้ในบ้าน": "#C084FC",
  "สุขภาพ": "#34D399",
  "การศึกษา": "#FBBF24",
  "บันเทิง": "#F87171",
  "ไม่ระบุ": "#9CA3AF",
};

const FALLBACK_COLORS = [
  "#818CF8", "#FB923C", "#60A5FA", "#F472B6", "#C084FC",
  "#34D399", "#FBBF24", "#F87171", "#2DD4BF", "#A78BFA",
];

function getCatColor(cat: string): string {
  if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
  const idx = cat.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[idx];
}

function ChartSection({
  monthlyData,
  categoryData,
}: {
  monthlyData: DashboardData["monthlyData"];
  categoryData: Record<string, number>;
}) {
  const { isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState("ทั้งหมด");
  const [tooltip, setTooltip] = useState<{
    category: string; amount: number; month: string; percent: string;
  } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const CATEGORY_ORDER = ["ช็อปปิ้ง", "อาหาร", "เดินทาง", "สาธารณูปโภค", "ของใช้ในบ้าน"];
  const allCategories = Object.keys(categoryData || {});
  const sortedCats = [
    ...CATEGORY_ORDER.filter((c) => allCategories.includes(c)),
    ...allCategories.filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const filteredMonthly = monthlyData.map((m) => {
    if (activeFilter === "ทั้งหมด") return m;
    return { ...m, categories: { [activeFilter]: m.categories?.[activeFilter] || 0 }, total: m.categories?.[activeFilter] || 0 };
  });

  const maxVal = Math.max(...filteredMonthly.map((m) => m.total || 0), 1);
  const niceMax = Math.ceil(maxVal / 1000) * 1000 || 1000;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(niceMax * p));
  const fmt = (v: number) => v >= 1000 ? `฿${(v / 1000).toFixed(1)}k` : `฿${v}`;
  const yearTotal = Object.values(categoryData || {}).reduce((a: number, b: number) => a + b, 0);

  const handleMouseEnter = (e: React.MouseEvent, category: string, amount: number, month: string, total: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = chartRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({ category, amount, month, percent: total > 0 ? ((amount / total) * 100).toFixed(1) : "0" });
    setTooltipPos({ x: rect.left - containerRect.left + rect.width / 2, y: rect.top - containerRect.top - 8 });
  };

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const subtext = isDark ? "text-white/50" : "text-gray-400";
  const maintext = isDark ? "text-white" : "text-gray-900";

  return (
    <div className={`lg:col-span-2 ${card} rounded-2xl p-6 border border-[var(--color-border)]`}>
      <h3 className={`text-lg font-bold mb-5 ${maintext}`}>ภาพรวมค่าใช้จ่ายรายเดือน</h3>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["ทั้งหมด", ...sortedCats].map((cat) => (
          <button key={cat} onClick={() => setActiveFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === cat ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25" : isDark ? "bg-white/8 text-white/60 hover:bg-white/12" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mb-5 flex-wrap">
        {(activeFilter === "ทั้งหมด" ? sortedCats : [activeFilter]).map((cat) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCatColor(cat) }} />
            <span className={`text-xs ${subtext}`}>{cat}</span>
          </div>
        ))}
      </div>

      <div ref={chartRef} className="relative" style={{ height: "380px" }}>
        <div className="absolute inset-0 flex">
          <div className="flex flex-col justify-between pr-3 py-0" style={{ width: "55px" }}>
            {[...yTicks].reverse().map((v, i) => (
              <span key={i} className={`text-[11px] text-right ${subtext}`}>{fmt(v)}</span>
            ))}
          </div>

          <div className="flex-1 relative">
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <div key={i} className={`absolute left-0 right-0 border-t ${isDark ? "border-white/5" : "border-gray-100"}`} style={{ top: `${(1 - p) * 100}%` }} />
            ))}

            <div className="absolute inset-0 flex items-end justify-around px-1 pb-7">
              {filteredMonthly.map((m, idx) => {
                const barH = niceMax > 0 ? ((m.total || 0) / niceMax) * 100 : 0;
                const displayCats = activeFilter === "ทั้งหมด" ? sortedCats : [activeFilter];
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end" style={{ width: `${Math.max(100 / filteredMonthly.length - 1.5, 4)}%` }}>
                    <div className="w-full rounded-t-md overflow-hidden flex flex-col-reverse" style={{ height: `${barH}%`, minHeight: m.total > 0 ? "4px" : "0" }}>
                      {displayCats.map((cat) => {
                        const val = m.categories?.[cat] || 0;
                        if (val === 0) return null;
                        const segPct = (val / (m.total || 1)) * 100;
                        return (
                          <div key={cat} className="w-full transition-all duration-150 cursor-pointer hover:brightness-125"
                            style={{ height: `${segPct}%`, backgroundColor: getCatColor(cat), minHeight: "3px" }}
                            onMouseEnter={(e) => handleMouseEnter(e, cat, val, m.month, m.total)}
                            onMouseLeave={() => setTooltip(null)} />
                        );
                      })}
                    </div>
                    <span className={`text-[10px] mt-2 ${subtext}`}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {tooltip && (
          <div className="absolute z-50 pointer-events-none" style={{ left: tooltipPos.x, top: tooltipPos.y, transform: "translate(-50%, -100%)" }}>
            <div className={`px-3 py-2.5 rounded-xl text-xs whitespace-nowrap backdrop-blur-sm ${isDark ? "bg-[#2a2a2a]/95 text-white border border-white/10 shadow-xl shadow-black/40" : "bg-white/95 text-gray-900 border border-gray-200 shadow-xl shadow-black/10"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(tooltip.category) }} />
                <span className="font-semibold">{tooltip.category}</span>
              </div>
              <div className={`text-[10px] mb-1 ${subtext}`}>{tooltip.month}</div>
              <div className="font-bold text-sm">฿{tooltip.amount.toLocaleString()} <span className={`font-normal text-[11px] ${subtext}`}>({tooltip.percent}%)</span></div>
            </div>
            <div className="flex justify-center -mt-[1px]">
              <div className={`w-2.5 h-2.5 rotate-45 ${isDark ? "bg-[#2a2a2a]/95 border-r border-b border-white/10" : "bg-white/95 border-r border-b border-gray-200"}`} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-[var(--color-border)]">
        <h4 className={`text-sm font-medium mb-3 ${subtext}`}>สัดส่วนหมวดหมู่ (ทั้งปี)</h4>
        <div className="space-y-2.5">
          {sortedCats.map((cat) => {
            const val = categoryData?.[cat] || 0;
            const pct = yearTotal > 0 ? (val / yearTotal) * 100 : 0;
            return (
              <div key={cat} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 w-24">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(cat) }} />
                  <span className={`text-xs truncate ${subtext}`}>{cat}</span>
                </div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: getCatColor(cat) }} />
                </div>
                <span className={`text-xs w-12 text-right font-medium ${subtext}`}>{pct.toFixed(1)}%</span>
                <span className={`text-xs w-20 text-right font-semibold ${maintext}`}>฿{val.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { isDark, mounted } = useTheme();

  if (!mounted) return <div className="min-h-screen bg-[#111]" />;

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const txt = isDark ? "text-white" : "text-gray-900";
  const txtSub = isDark ? "text-white/50" : "text-gray-500";
  const txtMuted = isDark ? "text-white/30" : "text-gray-400";
  const tableBorder = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const tableRowHover = isDark ? "hover:bg-[rgba(255,255,255,0.03)]" : "hover:bg-gray-50";

  const stats = [
    { label: "ยอดรวมเดือนนี้", value: `฿${(data.totalAmount || 0).toLocaleString()}`, change: data.changePercent !== undefined ? `${data.changePercent >= 0 ? "↗" : "↘"} ${Math.abs(data.changePercent)}%` : undefined, icon: <TrendingUp size={20} />, color: "text-[#FA3633]" },
    { label: "จำนวนใบเสร็จ", value: `${data.receiptCount || 0} ใบ`, icon: <Receipt size={20} />, color: "text-[#FA3633]" },
    { label: "เฉลี่ยต่อใบ", value: `฿${(data.avgPerReceipt || 0).toLocaleString()}`, icon: <Calculator size={20} />, color: "text-[#FA3633]" },
    { label: "หมวดหมู่", value: `${data.categoryCount || 0} หมวด`, icon: <FolderOpen size={20} />, color: "text-[#FA3633]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${txt}`}>ภาพรวม</h1>
        <p className={`text-sm ${txtSub}`}>สรุปข้อมูลรายจ่ายและใบเสร็จของคุณ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`${card} border border-[var(--color-border)] rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`p-2 rounded-lg ${s.color} ${isDark ? "bg-[rgba(255,255,255,0.03)]" : "bg-gray-100"}`}>{s.icon}</span>
              {s.change && <span className="text-xs text-green-400">{s.change}</span>}
            </div>
            <div className={`text-2xl font-bold ${txt}`}>{s.value}</div>
            <div className={`text-sm ${txtSub}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartSection monthlyData={data.monthlyData} categoryData={data.categoryData} />

        <div className={`${card} border border-[var(--color-border)] rounded-2xl p-5`}>
          <h3 className={`font-semibold mb-4 ${txt}`}>หมวดหมู่ยอดนิยม</h3>
          {Object.keys(data.categoryData || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.categoryData || {}).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, amount], i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCatColor(name) }} />
                  <span className={`text-sm flex-1 ${txt}`}>{name}</span>
                  <span className={`text-sm font-medium ${txt}`}>฿{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className={`text-sm ${txtMuted} text-center py-8`}>ยังไม่มีข้อมูล</p>}
        </div>
      </div>

      <div className={`${card} border border-[var(--color-border)] rounded-xl overflow-hidden`}>
        <div className="p-5 flex items-center justify-between">
          <h3 className={`font-semibold ${txt}`}>ใบเสร็จล่าสุด</h3>
          <a href="/dashboard/receipts" className="text-sm text-[#FA3633] hover:underline">ดูทั้งหมด &rarr;</a>
        </div>
        <table className="w-full">
          <thead>
            <tr className={`border-t ${tableBorder}`}>
              {["ร้านค้า", "ประเภท", "หมวดหมู่", "จำนวนเงิน", "วันที่", "สถานะ"].map((h) => (
                <th key={h} className={`px-5 py-3 text-left text-xs font-medium ${txtSub} uppercase`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.recentReceipts || []).length > 0 ? (
              (data.recentReceipts || []).slice(0, 5).map((r) => (
                <tr key={r._id} className={`border-t ${tableBorder} ${tableRowHover} transition-colors`}>
                  <td className={`px-5 py-3 text-sm ${txt}`}>{r.storeName}</td>
                  <td className={`px-5 py-3 text-sm ${txtSub}`}>{r.type}</td>
                  <td className={`px-5 py-3 text-sm ${txtSub}`}>{r.category}</td>
                  <td className={`px-5 py-3 text-sm font-medium ${txt}`}>฿{(r.amount || 0).toLocaleString()}</td>
                  <td className={`px-5 py-3 text-sm ${txtSub}`}>{r.date}</td>
                  <td className="px-5 py-3"><span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">{r.status}</span></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className={`px-5 py-12 text-center text-sm ${txtMuted}`}>ยังไม่มีใบเสร็จ — ลองส่งรูปใบเสร็จผ่าน LINE ดูสิ!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
