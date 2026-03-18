"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Tag, Hash, TrendingDown, TrendingUp, PiggyBank, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

interface CategoryItem { name: string; count: number; total: number; direction: string; }
interface CustomCategory { name: string; emoji: string; color: string; direction: "expense" | "income" | "savings"; }

const DEFAULT_CATS: CustomCategory[] = [
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
  { name: "เงินเดือน", emoji: "💰", color: "#22c55e", direction: "income" },
  { name: "ฟรีแลนซ์", emoji: "💻", color: "#3b82f6", direction: "income" },
  { name: "ขายของ", emoji: "🛍️", color: "#f59e0b", direction: "income" },
  { name: "ลงทุน", emoji: "📈", color: "#8b5cf6", direction: "income" },
  { name: "โบนัส", emoji: "🎁", color: "#ec4899", direction: "income" },
  { name: "คืนเงิน", emoji: "↩️", color: "#14b8a6", direction: "income" },
  { name: "ดอกเบี้ย", emoji: "🏦", color: "#06b6d4", direction: "income" },
  { name: "ท่องเที่ยว", emoji: "✈️", color: "#818CF8", direction: "savings" },
  { name: "กองทุนฉุกเฉิน", emoji: "🛡️", color: "#34D399", direction: "savings" },
  { name: "บ้าน/รถ", emoji: "🏡", color: "#60A5FA", direction: "savings" },
  { name: "เกษียณ", emoji: "🌴", color: "#F472B6", direction: "savings" },
  { name: "เงินออม", emoji: "🐷", color: "#ec4899", direction: "savings" },
];

const COLORS = ["#FB923C","#60A5FA","#818CF8","#F472B6","#34D399","#FBBF24","#F87171","#A78BFA","#22c55e","#ec4899","#06b6d4","#F59E0B","#C084FC","#38BDF8","#78716c"];
const DIR_LABEL: Record<string, string> = { expense: "รายจ่าย", income: "รายรับ", savings: "เงินออม" };
const DIR_COLOR: Record<string, string> = { expense: "#FA3633", income: "#22c55e", savings: "#ec4899" };

export default function CategoriesClient({ categories }: { categories: CategoryItem[] }) {
  const { isDark } = useTheme();
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", emoji: "📋", color: COLORS[0], direction: "expense" });
  const [tab, setTab] = useState<"expense" | "income" | "savings">("expense");

  useEffect(() => { try { const s = localStorage.getItem("iped-custom-cats"); if (s) setCustomCats(JSON.parse(s)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem("iped-custom-cats", JSON.stringify(customCats)); }, [customCats, loaded]);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  // Merge defaults + custom
  const allCats = [...DEFAULT_CATS, ...customCats];
  const seenNames = new Set(allCats.map((c) => c.name + c.direction));
  categories.forEach((c) => { const key = c.name + c.direction; if (!seenNames.has(key)) { allCats.push({ name: c.name, emoji: "📋", color: "#9CA3AF", direction: c.direction as any }); seenNames.add(key); } });

  const filtered = allCats.filter((c) => c.direction === tab);
  const getCatData = (name: string) => categories.find((c) => c.name === name && c.direction === tab);
  const isCustom = (name: string) => customCats.some((c) => c.name === name && c.direction === tab);
  const totalCount = categories.reduce((s, d) => s + d.count, 0);

  const openAdd = () => { setEditingName(null); setForm({ name: "", emoji: "📋", color: COLORS[Math.floor(Math.random() * COLORS.length)], direction: tab }); setIsAdding(true); };
  const openEdit = (cat: CustomCategory) => { setEditingName(cat.name); setForm({ ...cat }); setIsAdding(true); };
  const handleSave = () => { if (!form.name) return; if (editingName) { setCustomCats((prev) => prev.map((c) => c.name === editingName && c.direction === form.direction ? { ...c, name: form.name, emoji: form.emoji, color: form.color } : c)); } else { setCustomCats((prev) => [...prev, { name: form.name, emoji: form.emoji, color: form.color, direction: form.direction as any }]); } setIsAdding(false); setEditingName(null); };
  const handleDelete = (name: string) => { if (confirm(`ลบหมวด "${name}"?`)) setCustomCats((prev) => prev.filter((c) => !(c.name === name && c.direction === tab))); };

  const inp = `w-full h-9 px-3 rounded-lg text-sm border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} focus:outline-none focus:border-[#FA3633]/50`;

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      {/* Add/Edit panel */}
      {isAdding && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsAdding(false)} />}
      {isAdding && (
        <div className="fixed inset-y-0 right-0 z-50 w-[380px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingName ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2>
              <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl">&times;</button>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center py-6 rounded-xl" style={{ backgroundColor: form.color + "15" }}>
              <span className="text-5xl mb-2">{form.emoji}</span>
              <span className="text-sm font-semibold text-white">{form.name || "ชื่อหมวด"}</span>
              <span className="text-[10px] mt-1" style={{ color: form.color }}>{DIR_LABEL[form.direction]}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">ชื่อหมวด</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น ค่าน้ำมัน, ค่าเช่า" className={inp} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">ไอคอน</label>
                <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className={`${inp} text-2xl text-center h-12`} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">สี</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110" : "hover:scale-110"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">กลุ่ม</label>
                <div className="flex gap-2">
                  {(["expense", "income", "savings"] as const).map((d) => (
                    <button key={d} onClick={() => setForm({ ...form, direction: d })} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${form.direction === d ? "text-white shadow-sm" : "text-white/40 bg-white/5 hover:text-white/60"}`} style={form.direction === d ? { backgroundColor: DIR_COLOR[d] } : {}}>{DIR_LABEL[d]}</button>
                  ))}
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
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25">
          <Plus size={16} />เพิ่มหมวด
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="หมวดทั้งหมด" value={`${allCats.length} หมวด`} icon={<Tag size={20} />} color="text-blue-500" />
        <StatsCard label="รายการทั้งหมด" value={`${totalCount} รายการ`} icon={<Hash size={20} />} color="text-green-500" />
        <StatsCard label="รายจ่ายรวม" value={`฿${categories.filter((c) => c.direction === "expense").reduce((s, d) => s + d.total, 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingDown size={20} />} color="text-[#FA3633]" />
        <StatsCard label="รายรับรวม" value={`฿${categories.filter((c) => c.direction === "income").reduce((s, d) => s + d.total, 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingUp size={20} />} color="text-green-500" />
      </div>

      {/* Tab switcher */}
      <div className={`${card} border ${border} rounded-xl p-1 flex`}>
        {(["expense", "income", "savings"] as const).map((d) => {
          const count = allCats.filter((c) => c.direction === d).length;
          return (
            <button key={d} onClick={() => setTab(d)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === d ? "text-white shadow-sm" : sub + " hover:text-white/70"}`} style={tab === d ? { backgroundColor: DIR_COLOR[d] } : {}}>
              {d === "expense" ? <TrendingDown size={15} /> : d === "income" ? <TrendingUp size={15} /> : <PiggyBank size={15} />}
              {DIR_LABEL[d]}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === d ? "bg-white/20" : isDark ? "bg-white/5" : "bg-gray-200"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((cat) => {
          const data = getCatData(cat.name);
          const hasData = data && data.count > 0;
          const canDelete = isCustom(cat.name);
          return (
            <div key={cat.name} className={`${card} border ${border} rounded-2xl p-4 group relative transition-all hover:shadow-md ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-gray-50"}`}>
              {/* Edit/Delete — top right on hover */}
              <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className={`p-1 rounded-md ${isDark ? "hover:bg-white/10 text-white/30" : "hover:bg-gray-200 text-gray-400"}`}><Pencil size={11} /></button>
                {canDelete && <button onClick={() => handleDelete(cat.name)} className={`p-1 rounded-md ${isDark ? "hover:bg-white/10 text-white/30 hover:text-red-400" : "hover:bg-gray-200 text-gray-400 hover:text-red-500"}`}><Trash2 size={11} /></button>}
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2" style={{ backgroundColor: cat.color + "20" }}>
                  {cat.emoji}
                </div>
                <span className={`text-sm font-medium ${txt} mb-1`}>{cat.name}</span>
                {hasData ? (
                  <>
                    <span className="text-lg font-bold" style={{ color: cat.color }}>฿{data.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[10px] ${muted} mt-0.5`}>{data.count} รายการ</span>
                  </>
                ) : (
                  <span className={`text-xs ${muted} mt-1`}>ยังไม่มีรายการ</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Add card */}
        <button onClick={openAdd} className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-colors min-h-[140px] ${isDark ? "border-white/10 hover:border-white/20 text-white/30 hover:text-white/50" : "border-gray-200 hover:border-gray-300 text-gray-400 hover:text-gray-500"}`}>
          <Plus size={24} className="mb-1" />
          <span className="text-xs font-medium">เพิ่มหมวด</span>
        </button>
      </div>
    </div>
  );
}
