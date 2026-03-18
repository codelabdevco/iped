"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Wallet, Target, AlertTriangle, TrendingDown, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

interface BudgetItem {
  id: number; category: string; emoji: string; budget: number; spent: number; color: string;
}

const INIT: BudgetItem[] = [
  { id: 1, category: "อาหาร", emoji: "🍜", budget: 8000, spent: 5250, color: "#FB923C" },
  { id: 2, category: "เดินทาง", emoji: "🚗", budget: 5000, spent: 4800, color: "#60A5FA" },
  { id: 3, category: "ช้อปปิ้ง", emoji: "🛒", budget: 6000, spent: 2490, color: "#A78BFA" },
  { id: 4, category: "สาธารณูปโภค", emoji: "💡", budget: 4000, spent: 3170, color: "#F472B6" },
  { id: 5, category: "สุขภาพ", emoji: "🏥", budget: 3000, spent: 3500, color: "#34D399" },
  { id: 6, category: "บันเทิง", emoji: "🎬", budget: 3000, spent: 1200, color: "#FBBF24" },
  { id: 7, category: "การศึกษา", emoji: "📚", budget: 2000, spent: 800, color: "#818CF8" },
  { id: 8, category: "อื่นๆ", emoji: "📦", budget: 2000, spent: 450, color: "#94A3B8" },
];

export default function BudgetPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const totalBudget = data.reduce((s, d) => s + d.budget, 0);
  const totalSpent = data.reduce((s, d) => s + d.spent, 0);
  const overBudget = data.filter(d => d.spent > d.budget).length;

  return (
    <div className="space-y-6">
      <PageHeader title="งบประมาณ" description="ตั้งงบประมาณและติดตามการใช้จ่าย" onClear={() => setData([])} actionLabel="ตั้งงบประมาณ" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="งบทั้งหมด" value={`฿${totalBudget.toLocaleString()}`} icon={<Wallet size={20} />} color="text-blue-500" />
        <StatsCard label="ใช้ไปแล้ว" value={`฿${totalSpent.toLocaleString()}`} icon={<TrendingDown size={20} />} color="text-orange-500" />
        <StatsCard label="คงเหลือ" value={`฿${(totalBudget - totalSpent).toLocaleString()}`} icon={<Target size={20} />} color="text-green-500" />
        <StatsCard label="เกินงบ" value={`${overBudget} หมวดหมู่`} icon={<AlertTriangle size={20} />} color="text-red-500" />
      </div>

      {data.length === 0 ? (
        <div className={`${card} border ${border} rounded-2xl p-12 text-center`}>
          <Wallet size={48} className={`mx-auto ${sub} mb-4`} />
          <h3 className={`text-lg font-medium ${sub}`}>ยังไม่ได้ตั้งงบประมาณ</h3>
          <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"} mt-2 max-w-md mx-auto`}>ตั้งงบประมาณแยกตามหมวดหมู่ เพื่อควบคุมการใช้จ่าย</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(item => {
            const pct = Math.min((item.spent / item.budget) * 100, 100);
            const isOver = item.spent > item.budget;
            const remaining = item.budget - item.spent;
            return (
              <div key={item.id} className={`${card} border ${border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <h3 className={`font-semibold ${txt}`}>{item.category}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOver && <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400">เกินงบ</span>}
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-2xl font-bold ${isOver ? "text-red-500" : txt}`}>฿{item.spent.toLocaleString()}</span>
                  <span className={`text-sm ${sub}`}>/ ฿{item.budget.toLocaleString()}</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: isOver ? "#EF4444" : item.color }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${isOver ? "text-red-400" : sub}`}>
                    {isOver ? `เกิน ฿${Math.abs(remaining).toLocaleString()}` : `เหลือ ฿${remaining.toLocaleString()}`}
                  </span>
                  <span className="text-xs font-medium" style={{ color: isOver ? "#EF4444" : item.color }}>{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
