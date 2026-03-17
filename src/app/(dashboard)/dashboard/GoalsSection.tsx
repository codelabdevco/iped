"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const BUDGET_DATA = [
  { name: "ช็อปปิ้ง", budget: 20000, color: "#818CF8" },
  { name: "อาหาร", budget: 15000, color: "#F9923C" },
  { name: "เดินทาง", budget: 12000, color: "#60A5FA" },
  { name: "สาธารณูปโภค", budget: 10000, color: "#F472B6" },
  { name: "ของใช้ในบ้าน", budget: 8000, color: "#A78BFA" },
];

const SAVINGS_DATA = [
  { name: "ซื้อ iPhone 17", target: 45000, saved: 28500, color: "#818CF8" },
  { name: "ท่องเที่ยวญี่ปุ่น", target: 80000, saved: 32000, color: "#F9923C" },
  { name: "กองทุนฉุกเฉิน", target: 100000, saved: 67000, color: "#60A5FA" },
];

interface Props {
  categoryData: Record<string, number>;
}

export default function GoalsSection({ categoryData }: Props) {
  const [tab, setTab] = useState<"budget" | "savings">("budget");
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);
  const { isDark } = useTheme();

  const totalBudget = BUDGET_DATA.reduce((s, b) => s + b.budget, 0);
  const yearTotal = Object.values(categoryData || {}).reduce((s, v) => s + v, 0);
  const monthlySpent = Math.round(yearTotal / 12);
  const budgetPct = Math.min((monthlySpent / totalBudget) * 100, 100);

  const totalTarget = SAVINGS_DATA.reduce((s, g) => s + g.target, 0);
  const totalSaved = SAVINGS_DATA.reduce((s, g) => s + g.saved, 0);
  const savingsPct = (totalSaved / totalTarget) * 100;

  const subtext = isDark ? "text-white/50" : "text-gray-400";
  const txt = isDark ? "text-white" : "text-gray-900";

  const budgetSegs = BUDGET_DATA.map((b) => {
    const spent = Math.round((categoryData?.[b.name] || 0) / 12);
    return { ...b, spent };
  });

  /* ─── Donut with hover tooltip ─── */
  const renderDonut = ({
    segments,
    centerVal,
    centerSub,
    tooltipData,
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

    // Pre-calculate offsets for tooltip positioning
    const segOffsets: { startAngle: number; endAngle: number; midAngle: number }[] = [];
    let accumOff = 0;
    segments.forEach((seg) => {
      const startAngle = (accumOff / circ) * 360 - 90;
      const dash = (seg.pct / 100) * circ;
      accumOff += dash;
      const endAngle = (accumOff / circ) * 360 - 90;
      const midAngle = (startAngle + endAngle) / 2;
      segOffsets.push({ startAngle, endAngle, midAngle });
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

        {/* Tooltip */}
        {hoveredSeg !== null && tooltipData[hoveredSeg] && (() => {
          const midAngle = segOffsets[hoveredSeg]?.midAngle ?? 0;
          const rad = (midAngle * Math.PI) / 180;
          const tooltipR = size / 2 + 16;
          const tx = size / 2 + Math.cos(rad) * tooltipR;
          const ty = size / 2 + Math.sin(rad) * tooltipR;
          const seg = segments[hoveredSeg];
          const data = tooltipData[hoveredSeg];

          return (
            <div className="absolute z-50 pointer-events-none"
              style={{
                left: tx,
                top: ty,
                transform: "translate(-50%, -50%)",
              }}>
              <div className={`px-3 py-2.5 rounded-xl text-xs whitespace-nowrap backdrop-blur-sm ${isDark
                ? "bg-[#2a2a2a]/95 text-white border border-white/10 shadow-xl shadow-black/40"
                : "bg-white/95 text-gray-900 border border-gray-200 shadow-xl shadow-black/10"
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }} />
                  <span className="font-semibold">{data.name}</span>
                </div>
                <div className="font-bold text-sm">{data.value}</div>
                <div className={`text-[10px] mt-0.5 ${subtext}`}>{data.detail}</div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const remaining = totalBudget - monthlySpent;

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
          {renderDonut({
            segments: budgetSegs.map((b) => ({
              pct: (b.budget / totalBudget) * budgetPct,
              color: b.color,
            })),
            centerVal: `${Math.round(budgetPct)}%`,
            centerSub: `฿${monthlySpent.toLocaleString()} / ฿${totalBudget.toLocaleString()}`,
            tooltipData: budgetSegs.map((b) => ({
              name: b.name,
              value: `฿${b.spent.toLocaleString()} / ฿${b.budget.toLocaleString()}`,
              detail: `${Math.min(Math.round((b.spent / b.budget) * 100), 999)}% ของงบ`,
            })),
          })}

          <div className="space-y-2.5 mt-1">
            {budgetSegs.map((b, i) => {
              const usagePct = Math.min((b.spent / b.budget) * 100, 100);
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
                      b.spent > b.budget ? "text-red-400"
                        : b.spent > b.budget * 0.8 ? "text-yellow-400"
                        : isDark ? "text-white/70" : "text-gray-600"
                    }`}>
                      ฿{b.spent.toLocaleString()} / ฿{b.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/6" : "bg-gray-100"}`}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${usagePct}%`,
                        backgroundColor: b.spent > b.budget ? "#f87171" : b.spent > b.budget * 0.8 ? "#F9DF24" : b.color,
                      }} />
                  </div>
                </div>
              );
            })}
          </div>

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
        </>
      ) : (
        <>
          {renderDonut({
            segments: SAVINGS_DATA.map((s) => ({
              pct: (s.saved / totalTarget) * 100,
              color: s.color,
            })),
            centerVal: `${Math.round(savingsPct)}%`,
            centerSub: `฿${totalSaved.toLocaleString()} / ฿${totalTarget.toLocaleString()}`,
            tooltipData: SAVINGS_DATA.map((s) => ({
              name: s.name,
              value: `฿${s.saved.toLocaleString()} / ฿${s.target.toLocaleString()}`,
              detail: `${Math.round((s.saved / s.target) * 100)}% สำเร็จ`,
            })),
          })}

          <div className="space-y-3">
            {SAVINGS_DATA.map((g, i) => {
              const pct = (g.saved / g.target) * 100;
              const isHovered = hoveredSeg === i;
              return (
                <div key={g.name}
                  className={`transition-all duration-200 rounded-lg px-1 -mx-1 ${isHovered ? (isDark ? "bg-white/5" : "bg-gray-50") : ""}`}
                  onMouseEnter={() => setHoveredSeg(i)}
                  onMouseLeave={() => setHoveredSeg(null)}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-xs ${subtext}`}>{g.name}</span>
                    <span className={`text-xs font-medium ${txt}`}>{Math.round(pct)}%</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/6" : "bg-gray-100"}`}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: g.color }} />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className={`text-[10px] ${subtext}`}>฿{g.saved.toLocaleString()}</span>
                    <span className={`text-[10px] ${subtext}`}>฿{g.target.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`mt-3 pt-3 border-t ${isDark ? "border-white/10" : "border-gray-100"}`}>
            <div className="flex justify-between mb-2">
              <span className={`text-xs ${subtext}`}>เป้าหมายรวม</span>
              <span className={`text-xs font-semibold ${txt}`}>฿{totalTarget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-xs ${subtext}`}>ออมแล้ว</span>
              <span className="text-xs font-semibold text-green-400">฿{totalSaved.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${subtext}`}>ยังขาด</span>
              <span className={`text-xs font-semibold ${isDark ? "text-white/70" : "text-gray-600"}`}>
                ฿{(totalTarget - totalSaved).toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
