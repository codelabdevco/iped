"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Wallet, Target, AlertTriangle, TrendingDown, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import Baht from "@/components/dashboard/Baht";

interface SpendingItem {
  category: string;
  spent: number;
  count: number;
}

interface BudgetEntry {
  category: string;
  emoji: string;
  budget: number;
  color: string;
}

const CATEGORY_MAP: Record<string, { emoji: string; color: string }> = {
  "อาหาร": { emoji: "🍜", color: "#FB923C" },
  "เดินทาง": { emoji: "🚗", color: "#60A5FA" },
  "ช็อปปิ้ง": { emoji: "🛒", color: "#A78BFA" },
  "สาธารณูปโภค": { emoji: "💡", color: "#F472B6" },
  "ของใช้ในบ้าน": { emoji: "🏠", color: "#C084FC" },
  "สุขภาพ": { emoji: "🏥", color: "#34D399" },
  "การศึกษา": { emoji: "📚", color: "#818CF8" },
  "บันเทิง": { emoji: "🎬", color: "#FBBF24" },
  "ที่พัก": { emoji: "🏨", color: "#A78BFA" },
  "คมนาคม": { emoji: "🚆", color: "#38BDF8" },
  "ธุรกิจ": { emoji: "💼", color: "#F59E0B" },
  "อื่นๆ": { emoji: "📦", color: "#94A3B8" },
  "ไม่ระบุ": { emoji: "📋", color: "#9CA3AF" },
};

function getCatInfo(cat: string) {
  return CATEGORY_MAP[cat] || { emoji: "📋", color: "#9CA3AF" };
}

export default function BudgetClient({ spending }: { spending: SpendingItem[] }) {
  const { isDark } = useTheme();
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [formCat, setFormCat] = useState("");
  const [formBudget, setFormBudget] = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("iped-budgets");
      if (saved) setBudgets(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  // Save
  useEffect(() => {
    if (loaded) localStorage.setItem("iped-budgets", JSON.stringify(budgets));
  }, [budgets, loaded]);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const borderCls = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const inp = `h-9 px-3 rounded-lg text-sm border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} focus:outline-none focus:border-[#FA3633]/50`;

  // Merge budgets with actual spending
  const mergedCategories = new Set([...budgets.map((b) => b.category), ...spending.map((s) => s.category)]);
  const items = Array.from(mergedCategories).map((cat) => {
    const b = budgets.find((x) => x.category === cat);
    const s = spending.find((x) => x.category === cat);
    const info = getCatInfo(cat);
    return {
      category: cat,
      emoji: b?.emoji || info.emoji,
      color: b?.color || info.color,
      budget: b?.budget || 0,
      spent: s?.spent || 0,
      count: s?.count || 0,
    };
  }).sort((a, b) => b.spent - a.spent);

  const totalBudget = items.reduce((s, d) => s + d.budget, 0);
  const totalSpent = items.reduce((s, d) => s + d.spent, 0);
  const overBudget = items.filter((d) => d.budget > 0 && d.spent > d.budget).length;
  const remaining = totalBudget - totalSpent;

  const handleSaveBudget = () => {
    if (!formCat || !formBudget) return;
    const info = getCatInfo(formCat);
    setBudgets((prev) => {
      const exists = prev.findIndex((b) => b.category === formCat);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = { ...next[exists], budget: Number(formBudget) };
        return next;
      }
      return [...prev, { category: formCat, emoji: info.emoji, color: info.color, budget: Number(formBudget) }];
    });
    setIsAdding(false);
    setEditingCat(null);
    setFormCat("");
    setFormBudget("");
  };

  const handleDelete = (cat: string) => {
    setBudgets((prev) => prev.filter((b) => b.category !== cat));
  };

  const openAdd = () => {
    setEditingCat(null);
    setFormCat("");
    setFormBudget("");
    setIsAdding(true);
  };

  const openEdit = (cat: string, budget: number) => {
    setEditingCat(cat);
    setFormCat(cat);
    setFormBudget(String(budget));
    setIsAdding(true);
  };

  // Categories available for adding
  const allCats = Object.keys(CATEGORY_MAP);
  const catOptions = allCats.map((c) => ({ value: c, label: `${getCatInfo(c).emoji} ${c}` }));

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      {/* Add/Edit panel */}
      {isAdding && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsAdding(false)} />}
      {isAdding && (
        <div className="fixed inset-y-0 right-0 z-50 w-[400px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingCat ? "แก้ไขงบ" : "ตั้งงบประมาณ"}</h2>
              <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl">&times;</button>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <div>
                <label className="block text-xs text-white/40 mb-1">หมวดหมู่</label>
                {editingCat ? (
                  <div className={`h-9 px-3 flex items-center rounded-lg bg-white/5 border border-white/10 text-white text-sm`}>{getCatInfo(editingCat).emoji} {editingCat}</div>
                ) : (
                  <select value={formCat} onChange={(e) => setFormCat(e.target.value)} className={`w-full ${inp}`}>
                    <option value="">เลือกหมวดหมู่</option>
                    {catOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">งบประมาณ/เดือน (฿)</label>
                <input type="number" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} placeholder="0.00" className={`w-full ${inp}`} autoFocus />
              </div>
            </div>
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button onClick={handleSaveBudget} disabled={!formCat || !formBudget} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40">{editingCat ? "บันทึก" : "ตั้งงบ"}</button>
              <button onClick={() => setIsAdding(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="งบประมาณ" description="ตั้งงบและติดตามการใช้จ่ายแยกตามหมวดหมู่" />
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25">
          <Plus size={16} />ตั้งงบ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="งบทั้งหมด" value={`฿${totalBudget.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Wallet size={20} />} color="text-blue-500" />
        <StatsCard label="ใช้ไปแล้ว" value={`฿${totalSpent.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingDown size={20} />} color="text-orange-500" />
        <StatsCard label="คงเหลือ" value={`฿${Math.max(0, remaining).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Target size={20} />} color={remaining >= 0 ? "text-green-500" : "text-red-500"} />
        <StatsCard label="เกินงบ" value={`${overBudget} หมวดหมู่`} icon={<AlertTriangle size={20} />} color={overBudget > 0 ? "text-red-500" : "text-green-500"} />
      </div>

      {items.length === 0 ? (
        <div className={`${card} border ${borderCls} rounded-2xl p-12 text-center`}>
          <Wallet size={48} className={`mx-auto ${sub} mb-4`} />
          <h3 className={`text-lg font-medium ${sub}`}>ยังไม่มีข้อมูล</h3>
          <p className={`text-sm ${muted} mt-2`}>เริ่มส่งสลิปผ่าน LINE หรือเพิ่มรายจ่ายเพื่อดูงบประมาณ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const hasBudget = item.budget > 0;
            const pct = hasBudget ? Math.min((item.spent / item.budget) * 100, 100) : 0;
            const isOver = hasBudget && item.spent > item.budget;
            const budgetRemaining = hasBudget ? item.budget - item.spent : 0;
            return (
              <div key={item.category} className={`${card} border ${borderCls} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <h3 className={`font-semibold ${txt}`}>{item.category}</h3>
                      <span className={`text-[11px] ${muted}`}>{item.count} รายการ</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOver && <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-red-500/20 text-red-400">เกินงบ</span>}
                    {hasBudget ? (
                      <>
                        <button onClick={() => openEdit(item.category, item.budget)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/30" : "hover:bg-gray-100 text-gray-400"}`}><Pencil size={12} /></button>
                        <button onClick={() => handleDelete(item.category)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/30 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}><Trash2 size={12} /></button>
                      </>
                    ) : (
                      <button onClick={() => { setFormCat(item.category); setFormBudget(""); setEditingCat(item.category); setIsAdding(true); }} className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${isDark ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>ตั้งงบ</button>
                    )}
                  </div>
                </div>

                <div className="flex items-end justify-between mb-2">
                  <Baht value={item.spent} direction="expense" className={`text-xl font-bold ${isOver ? "text-red-500" : txt}`} />
                  {hasBudget && <span className={`text-sm ${muted}`}>/ <Baht value={item.budget} direction="expense" className="" /></span>}
                </div>

                {hasBudget ? (
                  <>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: isOver ? "#EF4444" : item.color }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-[11px] ${isOver ? "text-red-400" : muted}`}>
                        {isOver ? `เกิน ฿${Math.abs(budgetRemaining).toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : `เหลือ ฿${budgetRemaining.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`}
                      </span>
                      <span className="text-[11px] font-semibold" style={{ color: isOver ? "#EF4444" : item.color }}>{pct.toFixed(0)}%</span>
                    </div>
                  </>
                ) : (
                  <div className={`text-[11px] ${muted} mt-1`}>ยังไม่ตั้งงบ — กดตั้งงบเพื่อติดตาม</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
