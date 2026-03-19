"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Target, Pencil, Check, X } from "lucide-react";

interface GoalCardProps {
  storageKey: string;
  current: number;
  label: string;
  color: "green" | "red" | "pink";
  period?: string;
}

const colorMap = {
  green: { bar: "#22c55e", bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-500", ring: "focus:border-green-500/50" },
  red: { bar: "#FA3633", bg: "bg-[#FA3633]/10", border: "border-[#FA3633]/20", text: "text-[#FA3633]", ring: "focus:border-[#FA3633]/50" },
  pink: { bar: "#ec4899", bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-500", ring: "focus:border-pink-500/50" },
};

export default function GoalCard({ storageKey, current, label, color, period = "เดือนนี้" }: GoalCardProps) {
  const { isDark } = useTheme();
  const [goal, setGoal] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setGoal(Number(saved));
    } catch {}
    setLoaded(true);
  }, [storageKey]);

  const saveGoal = () => {
    const val = Number(input);
    if (val > 0) {
      setGoal(val);
      localStorage.setItem(storageKey, String(val));
    }
    setEditing(false);
  };

  const clearGoal = () => {
    setGoal(0);
    localStorage.removeItem(storageKey);
    setEditing(false);
  };

  if (!loaded) return null;

  const c = colorMap[color];
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const remaining = goal > 0 ? Math.max(0, goal - current) : 0;
  const exceeded = goal > 0 && current > goal;

  const cardBg = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const cardBorder = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const txt = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const inputCls = `h-10 px-3 rounded-lg text-sm border w-full ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} focus:outline-none ${c.ring}`;

  // No goal set
  if (goal === 0) {
    return (
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
        {editing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Target size={14} className={c.text} />
              <span className={`text-xs font-medium ${sub}`}>{label}</span>
            </div>
            <input type="number" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ใส่จำนวนเงิน" className={inputCls} autoFocus onKeyDown={(e) => e.key === "Enter" && saveGoal()} />
            <div className="flex gap-2">
              <button onClick={saveGoal} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
                <Check size={12} className="inline mr-1" />บันทึก
              </button>
              <button onClick={() => setEditing(false)} className={`py-2 px-3 rounded-lg text-xs ${isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-400"}`}>
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setInput(""); setEditing(true); }} className={`flex items-center gap-2 text-sm ${c.text} w-full active:scale-[0.97] transition-all`}>
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
              <Target size={16} />
            </div>
            <div className="text-left">
              <p className={`text-xs font-semibold`}>ตั้ง{label}</p>
              <p className={`text-[10px] ${muted}`}>{period}</p>
            </div>
          </button>
        )}
      </div>
    );
  }

  // Goal is set
  return (
    <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Target size={14} className={c.text} />
          <span className={`text-xs font-medium ${sub}`}>{label}</span>
        </div>
        <button onClick={() => { setInput(String(goal)); setEditing(true); }} className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/30" : "hover:bg-gray-100 text-gray-400"}`}>
          <Pencil size={12} />
        </button>
      </div>

      {editing ? (
        <div className="space-y-2 mb-2">
          <input type="number" value={input} onChange={(e) => setInput(e.target.value)} className={inputCls} autoFocus onKeyDown={(e) => e.key === "Enter" && saveGoal()} />
          <div className="flex gap-2">
            <button onClick={saveGoal} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
              <Check size={12} className="inline mr-1" />บันทึก
            </button>
            <button onClick={clearGoal} className={`py-1.5 px-2 rounded-lg text-[10px] ${isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400"}`}>ลบเป้า</button>
          </div>
        </div>
      ) : (
        <div className="mb-2">
          <span className={`text-lg font-bold ${txt}`}>฿{current.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
          <span className={`text-[10px] ${muted} ml-1`}>/ ฿{goal.toLocaleString()}</span>
        </div>
      )}

      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: exceeded ? "#ef4444" : c.bar }} />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-[10px] ${muted}`}>
          {exceeded
            ? `เกินเป้า ฿${(current - goal).toLocaleString()}`
            : `เหลืออีก ฿${remaining.toLocaleString()}`}
        </span>
        <span className="text-[10px] font-semibold" style={{ color: exceeded ? "#ef4444" : c.bar }}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
