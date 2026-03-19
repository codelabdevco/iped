"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  TrendingUp, Receipt, Calculator, FolderOpen,
  Download, AlertTriangle, X, FileText, Table,
} from "lucide-react";
import GoalsSection from "./GoalsSection";
import BrandIcon from "@/components/dashboard/BrandIcon";
import DateRangePicker from "./DateRangePicker";

import ReceiptsTable from './ReceiptsTable';
import OnboardingChecklist from './OnboardingChecklist';

interface DashboardData {
  totalAmount: number;
  changePercent: number;
  receiptCount: number;
  avgPerReceipt: number;
  categoryCount: number;
  monthlyData: { month: string; categories: Record<string, number>; total: number }[];
  categoryData: Record<string, number>;
  paymentData?: Record<string, number>;
  connections?: { line: boolean; gmail: boolean; drive: boolean; sheets: boolean; notion: boolean };
  savingsByCategory?: Record<string, number>;
  recentReceipts: {
    _id: string; storeName: string; type: string; category: string;
    amount: number; date: string; status: string; time?: string; description?: string;
  }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "ช็อปปิ้ง": "#818CF8", "อาหาร": "#FB923C", "เดินทาง": "#60A5FA",
  "สาธารณูปโภค": "#F472B6", "ของใช้ในบ้าน": "#C084FC", "สุขภาพ": "#34D399",
  "การศึกษา": "#FBBF24", "บันเทิง": "#F87171", "ไม่ระบุ": "#9CA3AF",
};
const FALLBACK_COLORS = ["#818CF8","#FB923C","#60A5FA","#F472B6","#C084FC","#34D399","#FBBF24","#F87171","#2DD4BF","#A78BFA"];

function getBudgetLimits(): Record<string, number> {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem("iped-budgets") : null;
    if (s) {
      const parsed = JSON.parse(s);
      const limits: Record<string, number> = {};
      parsed.forEach((b: any) => { if (b.category && b.budget) limits[b.category] = b.budget; });
      if (Object.keys(limits).length > 0) return limits;
    }
  } catch {}
  return {};
}

function getCatColor(cat: string): string {
  if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
  const idx = cat.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[idx];
}

function getThaiType(t: string): string {
  if (t === 'receipt') return 'ใบเสร็จ';
  if (t === 'invoice') return 'ใบแจ้งหนี้';
  if (t === 'payment') return 'ใบรับเงิน';
  return t;
}

function getStatusInfo(s: string): { label: string; cls: string } {
  if (s === 'confirmed') return { label: 'ยืนยันแล้ว', cls: 'bg-green-500/10 text-green-400' };
  if (s === 'pending') return { label: 'รอตรวจสอบ', cls: 'bg-yellow-500/10 text-yellow-400' };
  if (s === 'rejected') return { label: 'ปฏิเสธ', cls: 'bg-red-500/10 text-red-400' };
  if (s === 'duplicate') return { label: 'เอกสารซ้ำ', cls: 'bg-orange-500/10 text-orange-400' };
  return { label: s, cls: 'bg-gray-500/10 text-gray-400' };
}


/* ─── Export helpers ─── */
function exportCSV(data: DashboardData) {
  const BOM = "\uFEFF";
  let csv = BOM + "ร้านค้า,ประเภท,รายละเอียด,หมวดหมู่,จำนวนเงิน,วันที่,เวลา,สถานะ\n";
  data.recentReceipts.forEach((r) => {
    csv += `"${r.storeName}","${r.type}","${r.description || ""}","${r.category}",${r.amount},"${r.date}","${r.time || ""}","${r.status}"\n`;
  });
  csv += "\n\nสรุปหมวดหมู่\nหมวดหมู่,ยอดรวม\n";
  Object.entries(data.categoryData).forEach(([cat, val]) => {
    csv += `"${cat}",${val}\n`;
  });
  csv += `\nยอดรวม,${data.totalAmount}\nจำนวนใบเสร็จ,${data.receiptCount}\nเฉลี่ยต่อใบ,${data.avgPerReceipt}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asim-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(data: DashboardData) {
  const cats = Object.entries(data.categoryData)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${cat}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">฿${val.toLocaleString()}</td></tr>`)
    .join("");
  const receipts = data.recentReceipts
    .map((r) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${r.storeName}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">$<span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: getCatColor(r.category) }} />{r.category}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">฿${r.amount.toLocaleString()}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${r.date}</td></tr>`)
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>อาซิ่ม Report</title>
<style>body{font-family:'Sarabun',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#111}
h1{color:#FA3633;margin-bottom:4px}h2{margin-top:32px;color:#333;border-bottom:2px solid #FA3633;padding-bottom:8px}
table{width:100%;border-collapse:collapse;margin-top:12px}th{text-align:left;padding:8px 12px;background:#f8f8f8;font-weight:600}
.stats{display:flex;gap:16px;margin:20px 0}.stat{flex:1;background:#f8f8f8;padding:16px;border-radius:12px;text-align:center}
.stat-val{font-size:24px;font-weight:700;color:#FA3633}.stat-label{font-size:13px;color:#666;margin-top:4px}
@media print{body{padding:20px}}</style></head><body>
<h1>อาซิ่ม</h1><p style="color:#666;margin-top:0">รายงานสรุปรายจ่าย — ${new Date().toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"})}</p>
<div class="stats"><div class="stat"><div class="stat-val">฿${data.totalAmount.toLocaleString()}</div><div class="stat-label">ยอดรวม</div></div>
<div class="stat"><div class="stat-val">${data.receiptCount}</div><div class="stat-label">ใบเสร็จ</div></div>
<div class="stat"><div class="stat-val">฿${data.avgPerReceipt.toLocaleString()}</div><div class="stat-label">เฉลี่ยต่อใบ</div></div>
<div class="stat"><div class="stat-val">${data.categoryCount}</div><div class="stat-label">หมวดหมู่</div></div></div>
<h2>สรุปตามหมวดหมู่</h2><table><tr><th>หมวดหมู่</th><th style="text-align:right">ยอดรวม</th></tr>${cats}</table>
<h2>ใบเสร็จล่าสุด</h2><table><tr><th>ร้านค้า</th><th>หมวดหมู่</th><th style="text-align:right">จำนวนเงิน</th><th>วันที่</th></tr>${receipts}</table>
<p style="text-align:center;color:#999;margin-top:40px;font-size:12px">สร้างโดย อาซิ่ม — Powered by codelabs tech</p>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
}

/* ─── Budget Alert logic ─── */
function getBudgetAlerts(categoryData: Record<string, number>): { cat: string; spent: number; budget: number; pct: number }[] {
  const limits = getBudgetLimits();
  const alerts: { cat: string; spent: number; budget: number; pct: number }[] = [];
  Object.entries(limits).forEach(([cat, budget]) => {
    const spent = categoryData[cat] || 0;
    const pct = (spent / budget) * 100;
    if (pct >= 80) alerts.push({ cat, spent, budget, pct });
  });
  return alerts.sort((a, b) => b.pct - a.pct);
}

/* ─── Chart Section (unchanged logic) ─── */
function ChartSection({
  monthlyData, categoryData,
}: {
  monthlyData: DashboardData["monthlyData"];
  categoryData: Record<string, number>;
}) {
  const { isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState("ทั้งหมด");
  const [tooltip, setTooltip] = useState<{ category: string; amount: number; month: string; percent: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const CATEGORY_ORDER = ["ช็อปปิ้ง", "อาหาร", "เดินทาง", "สาธารณูปโภค", "ของใช้ในบ้าน"];
  const allCategories = Object.keys(categoryData || {});
  const sortedCats = [...CATEGORY_ORDER.filter((c) => allCategories.includes(c)), ...allCategories.filter((c) => !CATEGORY_ORDER.includes(c))];

  const filteredMonthly = monthlyData.map((m) => {
    if (activeFilter === "ทั้งหมด") return m;
    return { ...m, categories: { [activeFilter]: m.categories?.[activeFilter] || 0 }, total: m.categories?.[activeFilter] || 0 };
  });

  const maxVal = Math.max(...filteredMonthly.map((m) => m.total || 0), 1);
  const niceMax = Math.ceil(maxVal / 1000) * 1000 || 1000;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(niceMax * p));
  const fmt = (v: number) => (v >= 1000 ? `฿${(v / 1000).toFixed(1)}k` : `฿${v}`);
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
          <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === cat ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25" : isDark ? "bg-white/8 text-white/60 hover:bg-white/12" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
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
            {[...yTicks].reverse().map((v, i) => (<span key={i} className={`text-[11px] text-right ${subtext}`}>{fmt(v)}</span>))}
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
                        const pct = val > 0 ? 50 : 0;
                        if (val === 0) return null;
                                                return (
                          <div key={cat} className="w-full transition-all duration-150 cursor-pointer hover:brightness-125"
                            style={{ flex: `${val} 0 0%`, backgroundColor: getCatColor(cat), minHeight: "2px" }}
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
              <div
                    key={cat}
                    className="flex items-center gap-3 relative cursor-pointer"
                    onMouseEnter={() => setHoveredCat(cat)}
                    onMouseLeave={() => setHoveredCat(null)}
                  >
                <div className="flex items-center gap-1.5 w-24">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(cat) }} />
                  <span className={`text-xs truncate ${subtext}`}>{cat}</span>
                </div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: getCatColor(cat) }} />
                </div>
                <span className={`text-xs w-12 text-right font-medium ${subtext}`}>{pct.toFixed(1)}%</span>
                <span className={`text-xs w-20 text-right font-semibold ${maintext}`}>฿{val.toLocaleString()}</span>
                    {hoveredCat === cat && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                        <div className={`px-3 py-2.5 rounded-xl text-xs whitespace-nowrap backdrop-blur-sm ${isDark ? "bg-[#2a2a2a]/95 text-white border border-white/10 shadow-xl shadow-black/40" : "bg-white/95 text-gray-900 border border-gray-200 shadow-xl shadow-black/10"}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(cat) }} />
                            <span className="font-semibold">{cat}</span>
                          </div>
                          <div className="font-bold text-sm">฿{val.toLocaleString()}</div>
                          <div className={subtext}>{pct.toFixed(1)}% ของทั้งหมด</div>
                        </div>
                        <div className="flex justify-center -mt-[1px]">
                          <div className={`w-2.5 h-2.5 rotate-45 ${isDark ? "bg-[#2a2a2a]/95 border-r border-b border-white/10" : "bg-white/95 border-r border-b border-gray-200"}`} />
                        </div>
                      </div>
                    )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function DashboardClient({ data: initialData }: { data: DashboardData | null }) {
  const { isDark, mounted } = useTheme();
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), 0, 1));
  const [dateTo, setDateTo] = useState(now);
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [hoveredReceipt, setHoveredReceipt] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Fetch data on mount + mode change
  useEffect(() => {
    const load = () => {
      setLoading(true);
      const params = new URLSearchParams({ from: dateFrom.toISOString(), to: dateTo.toISOString() });
      fetch(`/api/dashboard?${params}`)
        .then(r => r.ok ? r.json() : null)
        .then(json => { if (json) { setData(json); setAlertsDismissed(false); } })
        .finally(() => setLoading(false));
    };
    load();
    window.addEventListener("iped-mode-change", load);
    return () => window.removeEventListener("iped-mode-change", load);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchData = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
      const res = await fetch(`/api/dashboard?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setAlertsDismissed(false);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDateChange = (from: Date, to: Date) => {
    setDateFrom(from);
    setDateTo(to);
    fetchData(from, to);
  };

  if (!mounted) return <div className="min-h-screen bg-[#111]" />;

  if (!data || loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[#FA3633] border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 text-sm text-white/50">กำลังโหลดข้อมูล...</span>
    </div>
  );

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const txt = isDark ? "text-white" : "text-gray-900";
  const txtSub = isDark ? "text-white/50" : "text-gray-500";
  const txtMuted = isDark ? "text-white/30" : "text-gray-400";
  const tableBorder = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const tableRowHover = isDark ? "hover:bg-[rgba(255,255,255,0.03)]" : "hover:bg-gray-50";

  const budgetAlerts = getBudgetAlerts(data.categoryData);

  const stats = [
    { label: "ยอดรวมเดือนนี้", value: `฿${(data.totalAmount || 0).toLocaleString()}`, change: data.changePercent !== undefined ? `${data.changePercent >= 0 ? "↗" : "↘"} ${Math.abs(data.changePercent)}%` : undefined, icon: <TrendingUp size={20} />, color: "text-[#FA3633]" },
    { label: "จำนวนใบเสร็จ", value: `${data.receiptCount || 0} ใบ`, icon: <Receipt size={20} />, color: "text-[#FA3633]" },
    { label: "เฉลี่ยต่อใบ", value: `฿${(data.avgPerReceipt || 0).toLocaleString()}`, icon: <Calculator size={20} />, color: "text-[#FA3633]" },
    { label: "หมวดหมู่", value: `${data.categoryCount || 0} หมวด`, icon: <FolderOpen size={20} />, color: "text-[#FA3633]" },
  ];

  return (
    <div className="space-y-6">
      <OnboardingChecklist />

      {/* Connection status bar */}
      <div className={`flex flex-wrap gap-3 ${card} border border-[var(--color-border)] rounded-xl px-4 py-2.5`}>
        {[
          { name: "LINE", brand: "line", connected: data.connections?.line ?? false },
          { name: "Gmail", brand: "gmail", connected: data.connections?.gmail ?? false },
          { name: "Google Drive", brand: "google-drive", connected: data.connections?.drive ?? false },
          { name: "Google Sheet", brand: "google-sheets", connected: data.connections?.sheets ?? false },
          { name: "Notion", brand: "notion", connected: data.connections?.notion ?? false },
        ].map((s) => (
          <div key={s.name} className={`flex items-center gap-1.5 text-xs ${txtSub}`}>
            <BrandIcon brand={s.brand} size={16} />
            <span className={s.connected ? txt : ""}>{s.name}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${s.connected ? "bg-green-500" : isDark ? "bg-white/15" : "bg-gray-300"}`} />
          </div>
        ))}
        <a href="/dashboard/settings" className="ml-auto text-[11px] text-[#FA3633] hover:underline">ตั้งค่า</a>
      </div>

      {/* Header + Date Filter + Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${txt}`}>ภาพรวม</h1>
          <p className={`text-sm ${txtSub}`}>สรุปข้อมูลรายจ่ายและใบเสร็จของคุณ</p>
        </div>
        <div ref={exportRef} className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isDark ? "bg-white/8 text-white/70 hover:bg-white/12" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <Download size={16} />
            ส่งออกรายงาน
          </button>
          {showExportMenu && (
            <div className={`absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border shadow-xl overflow-hidden ${isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"}`}>
              <button onClick={() => { exportCSV(data); setShowExportMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isDark ? "text-white/70 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"}`}>
                <Table size={16} className="text-green-500" />
                ดาวน์โหลด CSV
              </button>
              <button onClick={() => { exportPDF(data); setShowExportMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isDark ? "text-white/70 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"}`}>
                <FileText size={16} className="text-red-500" />
                ดาวน์โหลด PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date Range Picker */}
      <div className={`${card} border border-[var(--color-border)] rounded-xl px-5 py-3`}>
        <DateRangePicker from={dateFrom} to={dateTo} onChange={handleDateChange} />
      </div>

      {/* Budget Alerts */}
      {!alertsDismissed && budgetAlerts.length > 0 && (
        <div className={`rounded-xl border p-4 ${isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <span className={`text-sm font-semibold ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                แจ้งเตือนงบประมาณ
              </span>
            </div>
            <button onClick={() => setAlertsDismissed(true)} className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/30" : "hover:bg-gray-200 text-gray-400"}`}>
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {budgetAlerts.map((a) => (
              <div key={a.cat} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(a.cat) }} />
                <span className={`text-sm flex-1 ${isDark ? "text-white/70" : "text-gray-700"}`}>
                  <span className="font-medium">{a.cat}</span>{" "}
                  {a.pct >= 100
                    ? <span className="text-red-500">เกินงบ! ใช้ไป ฿{a.spent.toLocaleString()} / ฿{a.budget.toLocaleString()} ({a.pct.toFixed(0)}%)</span>
                    : <span className="text-amber-500">ใกล้ถึงงบ ใช้ไป ฿{a.spent.toLocaleString()} / ฿{a.budget.toLocaleString()} ({a.pct.toFixed(0)}%)</span>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="w-5 h-5 border-2 border-[#FA3633] border-t-transparent rounded-full animate-spin" />
          <span className={`ml-2 text-sm ${txtSub}`}>กำลังโหลด...</span>
        </div>
      )}

      {/* Stats cards */}
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

      {/* Chart + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartSection monthlyData={data.monthlyData} categoryData={data.categoryData} />
        <div className={`${card} border border-[var(--color-border)] rounded-2xl p-5`}>
          <h3 className={`font-semibold mb-3 ${txt}`}>เป้าหมาย</h3>
          <GoalsSection categoryData={data.categoryData} savingsByCategory={data.savingsByCategory || {}} />
        </div>
      </div>

      {/* Budget + Recurring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget summary */}
        {(() => {
          const catEntries = Object.entries(data.categoryData || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
          const budgets: Record<string, number> = {};
          try { const s = typeof window !== "undefined" ? localStorage.getItem("iped-budgets") : null; if (s) JSON.parse(s).forEach((b: any) => { budgets[b.category] = b.budget; }); } catch {}
          const hasBudgets = Object.keys(budgets).length > 0;
          return (
            <div className={`${card} border border-[var(--color-border)] rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${txt}`}>งบประมาณ</h3>
                <a href="/dashboard/budget" className="text-sm text-[#FA3633] hover:underline">จัดการ &rarr;</a>
              </div>
              {catEntries.length === 0 ? (
                <p className={`text-sm ${txtSub}`}>ยังไม่มีข้อมูล</p>
              ) : (
                <div className="space-y-3">
                  {catEntries.map(([cat, spent]) => {
                    const budget = budgets[cat];
                    const pct = budget ? Math.min((spent / budget) * 100, 100) : 0;
                    const isOver = budget ? spent > budget : false;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCatColor(cat) }} />
                            <span className={`text-xs ${txt}`}>{cat}</span>
                          </div>
                          <span className={`text-xs font-medium ${isOver ? "text-red-500" : txt}`}>
                            ฿{spent.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            {budget ? <span className={txtSub}> / ฿{budget.toLocaleString()}</span> : ""}
                          </span>
                        </div>
                        {budget ? (
                          <div className="h-1.5 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isOver ? "#EF4444" : getCatColor(cat), opacity: 0.7 }} />
                          </div>
                        ) : (
                          <div className="h-1.5 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                            <div className="h-full rounded-full opacity-30" style={{ width: "100%", backgroundColor: getCatColor(cat) }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Recurring summary */}
        {(() => {
          const items = [
            { name: "ค่าเช่าคอนโด", type: "expense", amount: 12000, cycle: "รายเดือน", active: true },
            { name: "ค่าอินเทอร์เน็ต", type: "expense", amount: 599, cycle: "รายเดือน", active: true },
            { name: "Netflix", type: "expense", amount: 419, cycle: "รายเดือน", active: true },
          ];
          try { const s = typeof window !== "undefined" ? localStorage.getItem("iped-recurring") : null; if (s) { const p = JSON.parse(s); if (p.length) items.splice(0, items.length, ...p); } } catch {}
          const totalExp = items.filter((i) => i.type === "expense" && i.active).reduce((s, i) => s + i.amount, 0);
          return (
            <div className={`${card} border border-[var(--color-border)] rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${txt}`}>รายการประจำ</h3>
                <a href="/dashboard/recurring" className="text-sm text-[#FA3633] hover:underline">จัดการ &rarr;</a>
              </div>
              <div className="space-y-2">
                {items.filter((i) => i.active).slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold leading-none ${item.type === "income" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}`}>{item.type === "income" ? "รับ" : "จ่าย"}</span>
                      <span className={`text-xs ${txt}`}>{item.name}</span>
                    </div>
                    <span className={`text-xs font-medium ${txt}`}>฿{item.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}<span className={`text-[10px] ${txtSub} ml-1`}>/{item.cycle.replace("ราย", "")}</span></span>
                  </div>
                ))}
              </div>
              {totalExp > 0 && (
                <div className={`mt-3 pt-3 border-t border-[var(--color-border)] flex justify-between`}>
                  <span className={`text-xs ${txtSub}`}>รายจ่ายประจำ/เดือน</span>
                  <span className={`text-xs font-semibold text-red-500`}>฿{totalExp.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Payment methods */}
      {data.paymentData && Object.keys(data.paymentData).length > 0 && (() => {
        const PM_INFO: Record<string, { label: string; icon: string; color: string }> = {
          cash: { label: "เงินสด", icon: "💵", color: "#34D399" },
          promptpay: { label: "พร้อมเพย์", icon: "📱", color: "#6366f1" },
          transfer: { label: "โอนธนาคาร", icon: "🏦", color: "#F472B6" },
          credit: { label: "บัตรเครดิต", icon: "💳", color: "#818CF8" },
          debit: { label: "บัตรเดบิต", icon: "💳", color: "#60A5FA" },
          "bank-scb": { label: "SCB", icon: "🟣", color: "#4C2B91" },
          "bank-kbank": { label: "KBank", icon: "🟢", color: "#138F2D" },
          "bank-bbl": { label: "BBL", icon: "🔵", color: "#1E3A8A" },
          "bank-ktb": { label: "KTB", icon: "🔵", color: "#0EA5E9" },
          "bank-bay": { label: "BAY", icon: "🟡", color: "#EAB308" },
          "bank-tmb": { label: "TTB", icon: "🟠", color: "#F97316" },
          other: { label: "อื่นๆ", icon: "📋", color: "#94A3B8" },
        };
        const pmEntries = Object.entries(data.paymentData).sort((a, b) => b[1] - a[1]);
        const pmMax = Math.max(...pmEntries.map(([, v]) => v), 1);
        return (
          <div className={`${card} border border-[var(--color-border)] rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${txt}`}>วิธีจ่าย</h3>
              <a href="/dashboard/payments" className="text-sm text-[#FA3633] hover:underline">ดูทั้งหมด &rarr;</a>
            </div>
            <div className="space-y-2.5">
              {pmEntries.map(([method, amount]) => {
                const info = PM_INFO[method] || { label: method, icon: "📋", color: "#94A3B8" };
                const pct = (amount / pmMax) * 100;
                return (
                  <div key={method} className="flex items-center gap-3">
                    <BrandIcon brand={method} size={20} />
                    <span className={`text-xs w-20 truncate ${txtSub}`}>{info.label}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: info.color, opacity: 0.7 }} />
                    </div>
                    <span className={`text-xs font-semibold w-24 text-right ${txt}`}>฿{amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Recent receipts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${txt}`}>ใบเสร็จล่าสุด</h3>
          <a href="/dashboard/receipts" className="text-sm text-[#FA3633] hover:underline">ดูทั้งหมด &rarr;</a>
        </div>
        <ReceiptsTable receipts={data.recentReceipts || []} isDark={isDark} getCatColor={getCatColor} />
      </div>


    </div>
  );
}
