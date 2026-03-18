"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const SAVING_COLORS: Record<string, string> = {
  "ท่องเที่ยว": "#818CF8",
  "ซื้อของ": "#FB923C",
  "กองทุนฉุกเฉิน": "#34D399",
  "ลงทุน": "#8b5cf6",
  "การศึกษา": "#FBBF24",
  "บ้าน/รถ": "#60A5FA",
  "เกษียณ": "#F472B6",
  "เงินออม": "#ec4899",
  "อื่นๆ": "#78716c",
};

const BUDGET_COLORS: Record<string, string> = {
  "ช็อปปิ้ง": "#818CF8", "อาหาร": "#FB923C", "เดินทาง": "#60A5FA",
  "สาธารณูปโภค": "#F472B6", "ของใช้ในบ้าน": "#C084FC", "สุขภาพ": "#34D399",
  "การศึกษา": "#FBBF24", "บันเทิง": "#F87171", "ที่พัก": "#A78BFA",
  "ธุรกิจ": "#F59E0B", "อื่นๆ": "#78716C",
};
const FALLBACK_COLORS = ["#818CF8","#FB923C","#60A5FA","#F472B6","#C084FC","#34D399","#FBBF24","#F87171"];

interface Props {
  categoryData: Record<string, number>;
  savingsByCategory: Record<string, number>;
}

interface BudgetItem { category: string; budget: number }

export default function GoalsSection({ categoryData, savingsByCategory }: Props) {
  const [tab, setTab] = useState<"budget" | "savings">("budget");
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<Record<string, number>>({});
  const { isDark } = useTheme();

  useEffect(() => {
    // Load budgets from localStorage
    try {
      const s = localStorage.getItem("iped-budgets");
      if (s) setBudgets(JSON.parse(s));
    } catch {}
    // Load savings goals from localStorage
    try {
      const s = localStorage.getItem("iped-savings-goals");
      if (s) setSavingsGoals(JSON.parse(s));
    } catch {}
  }, []);

  const subtext = isDark ? "text-white/50" : "text-gray-400";
  const txt = isDark ? "text-white" : "text-gray-900";

  // Budget data — use real budgets from settings, match with real spending
  const budgetSegs = budgets.length > 0
    ? budgets.map((b) => ({
        name: b.category,
        budget: b.budget,
        spent: Math.round((categoryData?.[b.category] || 0) / 12),
        color: BUDGET_COLORS[b.category] || FALLBACK_COLORS[budgets.indexOf(b) % FALLBACK_COLORS.length],
      }))
    : Object.entries(categoryData || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, total], i) => ({
        name: cat,
        budget: 0,
        spent: Math.round(total / 12),
        color: BUDGET_COLORS[cat] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }));

  const totalBudget = budgetSegs.reduce((s, b) => s + (b.budget || b.spent * 1.5), 0);
  const monthlySpent = budgetSegs.reduce((s, b) => s + b.spent, 0);
  const budgetPct = totalBudget > 0 ? Math.min((monthlySpent / totalBudget) * 100, 100) : 0;

  // Savings data — use real savings by category
  const savingsEntries = Object.entries(savingsByCategory || {}).filter(([, v]) => v > 0);
  const savingsSegs = savingsEntries.map(([cat, saved], i) => ({
    name: cat,
    saved,
    target: savingsGoals[cat] || 0,
    color: SAVING_COLORS[cat] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));
  const totalSaved = savingsSegs.reduce((s, g) => s + g.saved, 0);
  const totalTarget = savingsSegs.reduce((s, g) => s + (g.target || g.saved), 0);
  const savingsPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  /* ─── Donut ─── */
  const renderDonut = ({
    segments, centerVal, centerSub, tooltipData,
  }: {
    segments: { pct: number; color: string }[];
    centerVal: string;
    centerSub: string;
    tooltipData: { name: string; value: string; detail: string }[];
  }) => {
    const size = 220;
    const sw = 22;
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    let off = 0;

    const segOffsets: { midAngle: number }[] = [];
    let accumOff = 0;
    segments.forEach((seg) => {
      const startAngle = (accumOff / circ) * 360 - 90;
      const dash = (seg.pct / 100) * circ;
      accumOff += dash;
      const endAngle = (accumOff / circ) * 360 - 90;
      segOffsets.push({ midAngle: (startAngle + endAngle) / 2 });
    });

    return (
      <div className="flex items-center justify-center py-2 relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6"} strokeWidth={sw} />
          {segments.map((seg, i) => {
            const dash = (seg.pct / 100) * circ;
            const gap = circ - dash;
            const cur = off;
            off += dash;
            const isHovered = hoveredSeg === i;
            return (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? sw + 6 : sw}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-cur}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all duration-200 cursor-pointer"
                style={{ filter: isHovered ? "brightness(1.2)" : "none" }}
                onMouseEnter={() => setHoveredSeg(i)}
                onMouseLeave={() => setHoveredSeg(null)}
              />
            );
          })}
          <text x={size / 2} y={size / 2 - 8} textAnchor="middle"
            className={`text-2xl font-bold ${isDark ? "fill-white" : "fill-gray-900"}`}>
            {centerVal}
          </text>
          <text x={size / 2} y={size / 2 + 14} textAnchor="middle"
            className={`text-[11px] ${isDark ? "fill-white/50" : "fill-gray-400"}`}>
            {centerSub}
          </text>
        </svg>

        {hoveredSeg !== null && tooltipData[hoveredSeg] && (() => {
          const midAngle = segOffsets[hoveredSeg]?.midAngle ?? 0;
          const rad = (midAngle * Math.PI) / 180;
          const tooltipR = size / 2 + 16;
          const tx = size / 2 + Math.cos(rad) * tooltipR;
          const ty = size / 2 + Math.sin(rad) * tooltipR;
          const seg = segments[hoveredSeg];
          const d = tooltipData[hoveredSeg];
          return (
            <div className="absolute z-50 pointer-events-none"
              style={{ left: tx, top: ty, transform: "translate(-50%, -50%)" }}>
              <div className={`px-3 py-2.5 rounded-xl text-xs whitespace-nowrap backdrop-blur-sm ${isDark
                ? "bg-[#2a2a2a]/95 text-white border border-white/10 shadow-xl shadow-black/40"
                : "bg-white/95 text-gray-900 border border-gray-200 shadow-xl shadow-black/10"
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="font-semibold">{d.name}</span>
                </div>
                <div className="font-bold text-sm">{d.value}</div>
                <div className={`text-[10px] mt-0.5 ${subtext}`}>{d.detail}</div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const remaining = totalBudget - monthlySpent;
  const hasBudgets = budgets.length > 0;

  return (
    <>
      <div className="flex gap-1 mb-3">
        {(["budget", "savings"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setHoveredSeg(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === t
                ? "bg-[#FA3633] text-white shadow-sm"
                : isDark ? "bg-white/8 text-white/60 hover:bg-white/12" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}>
            {t === "budget" ? "งบประมาณ" : "ออมเงิน"}
          </button>
        ))}
      </div>

      {tab === "budget" ? (
        <>
          {budgetSegs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className={`text-sm ${subtext}`}>ยังไม่มีข้อมูลค่าใช้จ่าย</p>
            </div>
          ) : (
            <>
              {renderDonut({
                segments: budgetSegs.map((b) => ({
                  pct: totalBudget > 0 ? ((b.budget || b.spent * 1.5) / totalBudget) * budgetPct : (100 / budgetSegs.length),
                  color: b.color,
                })),
                centerVal: hasBudgets ? `${Math.round(budgetPct)}%` : `฿${(monthlySpent / 1000).toFixed(0)}k`,
                centerSub: hasBudgets ? `฿${monthlySpent.toLocaleString()} / ฿${totalBudget.toLocaleString()}` : `เฉลี่ย/เดือน`,
                tooltipData: budgetSegs.map((b) => ({
                  name: b.name,
                  value: b.budget ? `฿${b.spent.toLocaleString()} / ฿${b.budget.toLocaleString()}` : `฿${b.spent.toLocaleString()}/เดือน`,
                  detail: b.budget ? `${Math.min(Math.round((b.spent / b.budget) * 100), 999)}% ของงบ` : "ยังไม่ได้ตั้งงบ",
                })),
              })}

              <div className="space-y-2.5 mt-1">
                {budgetSegs.map((b, i) => {
                  const usagePct = b.budget ? Math.min((b.spent / b.budget) * 100, 100) : 50;
                  const isHovered = hoveredSeg === i;
                  return (
                    <div key={b.name}
                      className={`transition-all duration-200 rounded-lg px-1 -mx-1 ${isHovered ? (isDark ? "bg-white/5" : "bg-gray-50") : ""}`}
                      onMouseEnter={() => setHoveredSeg(i)}
                      onMouseLeave={() => setHoveredSeg(null)}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                          <span className={`text-xs ${subtext}`}>{b.name}</span>
                        </div>
                        <span className={`text-xs font-medium ${
                          b.budget && b.spent > b.budget ? "text-red-400"
                            : b.budget && b.spent > b.budget * 0.8 ? "text-yellow-400"
                            : isDark ? "text-white/70" : "text-gray-600"
                        }`}>
                          ฿{b.spent.toLocaleString()}{b.budget ? ` / ฿${b.budget.toLocaleString()}` : "/เดือน"}
                        </span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/6" : "bg-gray-100"}`}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${usagePct}%`,
                            backgroundColor: b.budget && b.spent > b.budget ? "#f87171" : b.budget && b.spent > b.budget * 0.8 ? "#F9DF24" : b.color,
                            opacity: b.budget ? 1 : 0.5,
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasBudgets && (
                <div className={`mt-3 pt-3 border-t ${isDark ? "border-white/10" : "border-gray-100"}`}>
                  <div className="flex justify-between mb-2">
                    <span className={`text-xs ${subtext}`}>งบรวม/เดือน</span>
                    <span className={`text-xs font-semibold ${txt}`}>฿{totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${subtext}`}>คงเหลือ</span>
                    <span className={`text-xs font-semibold ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ฿{Math.abs(remaining).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {!hasBudgets && (
                <div className={`mt-3 pt-3 border-t ${isDark ? "border-white/10" : "border-gray-100"} text-center`}>
                  <a href="/dashboard/budget" className="text-xs text-[#FA3633] hover:underline">ตั้งงบประมาณ &rarr;</a>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {savingsSegs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className={`text-sm ${subtext}`}>ยังไม่มีข้อมูลเงินออม</p>
              <a href="/dashboard/savings" className="text-xs text-[#FA3633] hover:underline mt-2">เพิ่มเงินออม &rarr;</a>
            </div>
          ) : (
            <>
              {renderDonut({
                segments: savingsSegs.map((s) => ({
                  pct: totalSaved > 0 ? (s.saved / totalSaved) * 100 : (100 / savingsSegs.length),
                  color: s.color,
                })),
                centerVal: `฿${(totalSaved / 1000).toFixed(0)}k`,
                centerSub: `ออมแล้วทั้งหมด`,
                tooltipData: savingsSegs.map((s) => ({
                  name: s.name,
                  value: `฿${s.saved.toLocaleString()}`,
                  detail: s.target ? `เป้า ฿${s.target.toLocaleString()} (${Math.round((s.saved / s.target) * 100)}%)` : "ไม่ได้ตั้งเป้า",
                })),
              })}

              <div className="space-y-3">
                {savingsSegs.map((g, i) => {
                  const pct = g.target ? (g.saved / g.target) * 100 : 100;
                  const isHovered = hoveredSeg === i;
                  return (
                    <div key={g.name}
                      className={`transition-all duration-200 rounded-lg px-1 -mx-1 ${isHovered ? (isDark ? "bg-white/5" : "bg-gray-50") : ""}`}
                      onMouseEnter={() => setHoveredSeg(i)}
                      onMouseLeave={() => setHoveredSeg(null)}>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                          <span className={`text-xs ${subtext}`}>{g.name}</span>
                        </div>
                        <span className={`text-xs font-medium ${txt}`}>
                          ฿{g.saved.toLocaleString()}
                          {g.target ? <span className={subtext}> / ฿{g.target.toLocaleString()}</span> : ""}
                        </span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/6" : "bg-gray-100"}`}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: g.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={`mt-3 pt-3 border-t ${isDark ? "border-white/10" : "border-gray-100"}`}>
                <div className="flex justify-between mb-1">
                  <span className={`text-xs ${subtext}`}>ออมแล้ว</span>
                  <span className="text-xs font-semibold text-green-400">฿{totalSaved.toLocaleString()}</span>
                </div>
                <a href="/dashboard/savings" className="block text-center text-xs text-[#FA3633] hover:underline mt-2">ดูทั้งหมด &rarr;</a>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
