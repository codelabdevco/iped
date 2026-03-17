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

  const renderDonut = ({
    segments,
    centerVal,
    centerSub,
  }: {
    segments: { pct: number; color: string }[];
    centerVal: string;
    centerSub: string;
  }) => {
    const size = 220;
    const sw = 22;
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    let off = 0;

    return (
      <div className="flex items-center justify-center py-2">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6"}
            strokeWidth={sw}
          />
          {segments.map((seg, i) => {
            const dash = (seg.pct / 100) * circ;
            const gap = circ - dash;
            const cur = off;
            off += dash;
            return (
              <circle
                key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={seg.color} strokeWidth={sw}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-cur}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all duration-700"
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
      </div>
    );
  };

  const remaining = totalBudget - monthlySpent;

  return (
    <>
      <div className="flex gap-1 mb-3">
        {(["budget", "savings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === t
                ? "bg-[#FA3633] text-white shadow-sm"
                : isDark
                ? "bg-white/8 text-white/60 hover:bg-white/12"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
            centerSub: `฿${monthlySpent.toLocaleString()} / ฿${totalBudget.toLocaleString()}`
          })}

          <div className="space-y-2.5 mt-1">
            {budgetSegs.map((b) => {
              const usagePct = Math.min((b.spent / b.budget) * 100, 100);
              return (
                <div key={b.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                      <span className={`text-xs ${subtext}`}>{b.name}</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      b.spent > b.budget ? "text-red-400" :
                      b.spent > b.budget * 0.8 ? "text-yellow-400" :
                      isDark ? "text-white/70" : "text-gray-600"
                    }`}>
                      ฿{b.spent.toLocaleString()} / ฿{b.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/6" : "bg-gray-100"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${usagePct}%`,
                        backgroundColor: b.spent > b.budget ? "#f87171" : b.spent > b.budget * 0.8 ? "#F9DF24" : b.color,
                      }}
                    />
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
            centerSub: `฿${totalSaved.toLocaleString()} / ฿${totalTarget.toLocaleString()}`
          })}

          <div className="space-y-3">
            {SAVINGS_DATA.map((g) => {
              const pct = (g.saved / g.target) * 100;
              return (
                <div key={g.name}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-xs ${subtext}`}>{g.name}</span>
                    <span className={`text-xs font-medium ${txt}`}>{Math.round(pct)}%</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/6" : "bg-gray-100"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: g.color }}
                    />
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
