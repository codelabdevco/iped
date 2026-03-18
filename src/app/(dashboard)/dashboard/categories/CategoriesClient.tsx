"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Tag, Hash, TrendingDown, TrendingUp, PiggyBank, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

interface CategoryItem {
  name: string;
  count: number;
  total: number;
  direction: string;
}

interface CustomCategory {
  name: string;
  emoji: string;
  color: string;
  direction: "expense" | "income" | "savings";
}

const DEFAULT_EXPENSE: CustomCategory[] = [
  { name: "อาหาร", emoji: "🍜", color: "#FB923C", direction: "expense" },
  { name: "เดินทาง", emoji: "🚗", color: "#60A5FA", direction: "expense" },
  { name: "ช็อปปิ้ง", emoji: "🛒", color: "#818CF8", direction: "expense" },
  { name: "สาธารณูปโภค", emoji: "💡", color: "#F472B6", direction: "expense" },
  { name: "ของใช้ในบ้าน", emoji: "🏠", color: "#C084FC", direction: "expense" },
  { name: "สุขภาพ", emoji: "🏥", color: "#34D399", direction: "expense" },
  { name: "การศึกษา", emoji: "📚", color: "#FBBF24", direction: "expense" },
  { name: "บันเทิง", emoji: "🎬", color: "#F87171", direction: "expense" },
  { name: "ที่พัก", emoji: "🏨", color: "#A78BFA", direction: "expense" },
  { name: "ธุรกิจ", emoji: "💼", color: "#F59E0B", direction: "expense" },
  { name: "อื่นๆ", emoji: "📦", color: "#94A3B8", direction: "expense" },
];

const DEFAULT_INCOME: CustomCategory[] = [
  { name: "เงินเดือน", emoji: "💰", color: "#22c55e", direction: "income" },
  { name: "ฟรีแลนซ์", emoji: "💻", color: "#3b82f6", direction: "income" },
  { name: "ขายของ", emoji: "🛍️", color: "#f59e0b", direction: "income" },
  { name: "ลงทุน", emoji: "📈", color: "#8b5cf6", direction: "income" },
  { name: "โบนัส", emoji: "🎁", color: "#ec4899", direction: "income" },
  { name: "คืนเงิน", emoji: "↩️", color: "#14b8a6", direction: "income" },
  { name: "ดอกเบี้ย", emoji: "🏦", color: "#06b6d4", direction: "income" },
  { name: "อื่นๆ", emoji: "📋", color: "#78716c", direction: "income" },
];

const DEFAULT_SAVINGS: CustomCategory[] = [
  { name: "ท่องเที่ยว", emoji: "✈️", color: "#818CF8", direction: "savings" },
  { name: "ซื้อของ", emoji: "🎯", color: "#FB923C", direction: "savings" },
  { name: "กองทุนฉุกเฉิน", emoji: "🛡️", color: "#34D399", direction: "savings" },
  { name: "ลงทุน", emoji: "📊", color: "#8b5cf6", direction: "savings" },
  { name: "บ้าน/รถ", emoji: "🏡", color: "#60A5FA", direction: "savings" },
  { name: "เกษียณ", emoji: "🌴", color: "#F472B6", direction: "savings" },
  { name: "เงินออม", emoji: "🐷", color: "#ec4899", direction: "savings" },
  { name: "อื่นๆ", emoji: "📋", color: "#78716c", direction: "savings" },
];

const ALL_DEFAULTS = [...DEFAULT_EXPENSE, ...DEFAULT_INCOME, ...DEFAULT_SAVINGS];
const COLORS = ["#FB923C","#60A5FA","#818CF8","#F472B6","#34D399","#FBBF24","#F87171","#A78BFA","#22c55e","#ec4899","#06b6d4","#F59E0B","#C084FC","#38BDF8","#78716c"];

function Baht({ value, className = "" }: { value: number; className?: string }) {
  const whole = Math.floor(Math.abs(value)).toLocaleString();
  const dec = (Math.abs(value) % 1).toFixed(2).slice(1);
  return <span className={className}>฿{whole}<span className="text-[0.75em] opacity-50">{dec}</span></span>;
}

export default function CategoriesClient({ categories }: { categories: CategoryItem[] }) {
  const { isDark } = useTheme();
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", emoji: "📋", color: COLORS[0], direction: "expense" as string });

  useEffect(() => { try { const s = localStorage.getItem("iped-custom-cats"); if (s) setCustomCats(JSON.parse(s)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem("iped-custom-cats", JSON.stringify(customCats)); }, [customCats, loaded]);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  // Merge: defaults + custom + any from data
  const allCats = [...ALL_DEFAULTS, ...customCats];
  const seenNames = new Set(allCats.map((c) => c.name + c.direction));
  categories.forEach((c) => {
    const key = c.name + c.direction;
    if (!seenNames.has(key)) {
      allCats.push({ name: c.name, emoji: "📋", color: "#9CA3AF", direction: c.direction as any });
      seenNames.add(key);
    }
  });

  const getCatData = (name: string, dir: string) => categories.find((c) => c.name === name && c.direction === dir);
  const isCustom = (name: string, dir: string) => customCats.some((c) => c.name === name && c.direction === dir);
  const isDefault = (name: string, dir: string) => ALL_DEFAULTS.some((c) => c.name === name && c.direction === dir);

  const expense = allCats.filter((c) => c.direction === "expense");
  const income = allCats.filter((c) => c.direction === "income");
  const savings = allCats.filter((c) => c.direction === "savings");
  const totalCount = categories.reduce((s, d) => s + d.count, 0);
  const totalExpense = categories.filter((c) => c.direction === "expense").reduce((s, d) => s + d.total, 0);
  const totalIncome = categories.filter((c) => c.direction === "income").reduce((s, d) => s + d.total, 0);

  const openAdd = (dir: string) => { setEditingName(null); setForm({ name: "", emoji: "📋", color: COLORS[Math.floor(Math.random() * COLORS.length)], direction: dir }); setIsAdding(true); };
  const openEdit = (cat: CustomCategory) => { setEditingName(cat.name); setForm({ name: cat.name, emoji: cat.emoji, color: cat.color, direction: cat.direction }); setIsAdding(true); };

  const handleSave = () => {
    if (!form.name) return;
    if (editingName) {
      setCustomCats((prev) => prev.map((c) => c.name === editingName && c.direction === form.direction ? { ...c, name: form.name, emoji: form.emoji, color: form.color } : c));
    } else {
      setCustomCats((prev) => [...prev, { name: form.name, emoji: form.emoji, color: form.color, direction: form.direction as any }]);
    }
    setIsAdding(false); setEditingName(null);
  };

  const handleDelete = (name: string, dir: string) => {
    if (confirm(`ลบหมวด "${name}"?`)) setCustomCats((prev) => prev.filter((c) => !(c.name === name && c.direction === dir)));
  };

  const inp = `w-full h-9 px-3 rounded-lg text-sm border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} focus:outline-none focus:border-[#FA3633]/50`;
  const lbl = "block text-xs text-white/40 mb-1";

  const renderSection = (items: CustomCategory[], label: string, icon: React.ReactNode, accentColor: string, dir: string) => {
    const maxTotal = Math.max(...items.map((c) => getCatData(c.name, dir)?.total || 0), 1);
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ color: accentColor }}>{icon}</span>
            <h3 className={`text-sm font-semibold ${sub}`}>{label}</h3>
            <span className={`text-xs ${muted}`}>({items.length})</span>
          </div>
          <button onClick={() => openAdd(dir)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${isDark ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            <Plus size={12} /> เพิ่มหมวด
          </button>
        </div>
        <div className="space-y-1.5">
          {items.map((cat) => {
            const data = getCatData(cat.name, dir);
            const spent = data?.total || 0;
            const count = data?.count || 0;
            const pct = maxTotal > 0 ? (spent / maxTotal) * 100 : 0;
            const canEdit = isCustom(cat.name, dir);
            const canDelete = !isDefault(cat.name, dir) && isCustom(cat.name, dir);
            return (
              <div key={cat.name} className={`${card} border ${border} rounded-xl px-4 py-3 flex items-center gap-3 group`}>
                <span className="text-lg shrink-0">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${txt}`}>{cat.name}</span>
                    <div className="flex items-center gap-2">
                      {spent > 0 ? <Baht value={spent} className={`text-sm font-semibold ${txt}`} /> : <span className={`text-xs ${muted}`}>—</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                    <span className={`text-[10px] ${muted} w-14 text-right shrink-0`}>{count > 0 ? `${count} รายการ` : "ว่าง"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {(canEdit || !isDefault(cat.name, dir)) && (
                    <button onClick={() => openEdit(cat)} className={`p-1 rounded-lg ${isDark ? "hover:bg-white/5 text-white/30" : "hover:bg-gray-100 text-gray-400"}`}><Pencil size={11} /></button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(cat.name, dir)} className={`p-1 rounded-lg ${isDark ? "hover:bg-white/5 text-white/30 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}><Trash2 size={11} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      {/* Add/Edit panel */}
      {isAdding && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsAdding(false)} />}
      {isAdding && (
        <div className="fixed inset-y-0 right-0 z-50 w-[400px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingName ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2>
              <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl">&times;</button>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <div><label className={lbl}>ชื่อหมวดหมู่</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น ค่าน้ำมัน" className={inp} /></div>
              <div><label className={lbl}>Emoji</label><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className={`${inp} text-2xl text-center`} /></div>
              <div>
                <label className={lbl}>สี</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110" : "hover:scale-105"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div><label className={lbl}>กลุ่ม</label>
                <div className="flex gap-2">
                  {[{ v: "expense", l: "รายจ่าย", cl: "bg-red-500" }, { v: "income", l: "รายรับ", cl: "bg-green-500" }, { v: "savings", l: "เงินออม", cl: "bg-pink-500" }].map((o) => (
                    <button key={o.v} onClick={() => setForm({ ...form, direction: o.v })} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${form.direction === o.v ? `${o.cl} text-white shadow-sm` : "text-white/50 hover:text-white/70 bg-white/5"}`}>{o.l}</button>
                  ))}
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className={`${card} border ${border} rounded-xl px-4 py-3 flex items-center gap-3`}>
              <span className="text-lg">{form.emoji}</span>
              <div className="flex-1">
                <span className={`text-sm font-medium ${txt}`}>{form.name || "ตัวอย่าง"}</span>
                <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                  <div className="h-full rounded-full w-2/3" style={{ backgroundColor: form.color }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button onClick={handleSave} disabled={!form.name} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40">{editingName ? "บันทึก" : "เพิ่มหมวด"}</button>
              <button onClick={() => setIsAdding(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="หมวดหมู่" description="จัดการหมวดหมู่ทั้งหมดในระบบ" />
        <button onClick={() => openAdd("expense")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25">
          <Plus size={16} />เพิ่มหมวด
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="หมวดทั้งหมด" value={`${allCats.length} หมวด`} icon={<Tag size={20} />} color="text-blue-500" />
        <StatsCard label="รายการทั้งหมด" value={`${totalCount} รายการ`} icon={<Hash size={20} />} color="text-green-500" />
        <StatsCard label="รายจ่ายรวม" value={`฿${totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingDown size={20} />} color="text-[#FA3633]" />
        <StatsCard label="รายรับรวม" value={`฿${totalIncome.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingUp size={20} />} color="text-green-500" />
      </div>

      <div className="space-y-8">
        {renderSection(expense, "หมวดรายจ่าย", <TrendingDown size={16} />, "#FA3633", "expense")}
        {renderSection(income, "หมวดรายรับ", <TrendingUp size={16} />, "#22c55e", "income")}
        {renderSection(savings, "หมวดเงินออม", <PiggyBank size={16} />, "#ec4899", "savings")}
      </div>
    </div>
  );
}
