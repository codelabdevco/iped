"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Plus, X } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

interface CategoryItem { name: string; count: number; total: number; direction: string; }
interface CustomCategory { name: string; emoji: string; color: string; direction: string; }

const DEFAULTS: CustomCategory[] = [
  { name: "อาหาร", emoji: "🍜", color: "#FB923C", direction: "expense" },
  { name: "เดินทาง", emoji: "🚗", color: "#60A5FA", direction: "expense" },
  { name: "ช็อปปิ้ง", emoji: "🛒", color: "#818CF8", direction: "expense" },
  { name: "สาธารณูปโภค", emoji: "💡", color: "#F472B6", direction: "expense" },
  { name: "ของใช้ในบ้าน", emoji: "🏠", color: "#C084FC", direction: "expense" },
  { name: "สุขภาพ", emoji: "🏥", color: "#34D399", direction: "expense" },
  { name: "การศึกษา", emoji: "📚", color: "#FBBF24", direction: "expense" },
  { name: "บันเทิง", emoji: "🎬", color: "#F87171", direction: "expense" },
  { name: "ธุรกิจ", emoji: "💼", color: "#F59E0B", direction: "expense" },
  { name: "อื่นๆ", emoji: "📦", color: "#94A3B8", direction: "expense" },
  { name: "เงินเดือน", emoji: "💰", color: "#22c55e", direction: "income" },
  { name: "ฟรีแลนซ์", emoji: "💻", color: "#3b82f6", direction: "income" },
  { name: "ขายของ", emoji: "🛍️", color: "#f59e0b", direction: "income" },
  { name: "ลงทุน", emoji: "📈", color: "#8b5cf6", direction: "income" },
  { name: "โบนัส", emoji: "🎁", color: "#ec4899", direction: "income" },
  { name: "อื่นๆ", emoji: "📋", color: "#78716c", direction: "income" },
  { name: "ท่องเที่ยว", emoji: "✈️", color: "#818CF8", direction: "savings" },
  { name: "กองทุนฉุกเฉิน", emoji: "🛡️", color: "#34D399", direction: "savings" },
  { name: "บ้าน/รถ", emoji: "🏡", color: "#60A5FA", direction: "savings" },
  { name: "เงินออม", emoji: "🐷", color: "#ec4899", direction: "savings" },
];

const COLORS = ["#FB923C","#60A5FA","#818CF8","#F472B6","#34D399","#FBBF24","#F87171","#A78BFA","#22c55e","#ec4899","#F59E0B","#78716c"];
const SECTIONS = [
  { key: "expense", label: "รายจ่าย", accent: "#FA3633" },
  { key: "income", label: "รายรับ", accent: "#22c55e" },
  { key: "savings", label: "เงินออม", accent: "#ec4899" },
];

export default function CategoriesClient({ categories }: { categories: CategoryItem[] }) {
  const { isDark } = useTheme();
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addingDir, setAddingDir] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", emoji: "📋", color: COLORS[0] });

  useEffect(() => { try { const s = localStorage.getItem("iped-custom-cats"); if (s) setCustomCats(JSON.parse(s)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem("iped-custom-cats", JSON.stringify(customCats)); }, [customCats, loaded]);

  const sub = isDark ? "text-white/40" : "text-gray-400";
  const muted = isDark ? "text-white/30" : "text-gray-300";
  const txt = isDark ? "text-white" : "text-gray-900";

  const allCats = [...DEFAULTS, ...customCats];
  const getCatData = (name: string, dir: string) => categories.find((c) => c.name === name && c.direction === dir);

  const handleAdd = () => {
    if (!form.name || !addingDir) return;
    setCustomCats((prev) => [...prev, { name: form.name, emoji: form.emoji, color: form.color, direction: addingDir }]);
    setAddingDir(null);
    setForm({ name: "", emoji: "📋", color: COLORS[0] });
  };

  const handleDelete = (name: string, dir: string) => {
    setCustomCats((prev) => prev.filter((c) => !(c.name === name && c.direction === dir)));
  };

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="หมวดหมู่" description={`${allCats.length} หมวด · ${categories.reduce((s, d) => s + d.count, 0)} รายการ`} />

      {SECTIONS.map((sec) => {
        const items = allCats.filter((c) => c.direction === sec.key);
        const total = categories.filter((c) => c.direction === sec.key).reduce((s, d) => s + d.total, 0);
        return (
          <div key={sec.key}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.accent }} />
                <span className={`text-sm font-semibold ${txt}`}>{sec.label}</span>
                {total > 0 && <span className={`text-xs ${sub}`}>฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {items.map((cat) => {
                const data = getCatData(cat.name, sec.key);
                const isCustom = customCats.some((c) => c.name === cat.name && c.direction === sec.key);
                return (
                  <div key={cat.name} className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full border transition-colors group ${isDark ? "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                    <span className="text-sm">{cat.emoji}</span>
                    <span className={`text-xs font-medium ${txt}`}>{cat.name}</span>
                    {data && data.count > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: cat.color + "20", color: cat.color }}>{data.count}</span>
                    )}
                    {isCustom && (
                      <button onClick={() => handleDelete(cat.name, sec.key)} className={`p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "hover:bg-white/10 text-white/30" : "hover:bg-gray-200 text-gray-400"}`}><X size={12} /></button>
                    )}
                  </div>
                );
              })}

              {/* Inline add */}
              {addingDir === sec.key ? (
                <div className={`inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full border ${isDark ? "bg-white/[0.04] border-white/[0.08]" : "bg-white border-gray-300"}`}>
                  <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className={`w-7 text-center text-sm bg-transparent focus:outline-none ${txt}`} />
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ชื่อหมวด" className={`w-20 text-xs bg-transparent focus:outline-none ${txt} placeholder:${muted}`} autoFocus onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
                  <div className="flex gap-0.5">
                    {COLORS.slice(0, 6).map((c) => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-4 h-4 rounded-full ${form.color === c ? "ring-1 ring-white ring-offset-1 ring-offset-transparent" : ""}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <button onClick={handleAdd} className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: sec.accent }}>เพิ่ม</button>
                  <button onClick={() => setAddingDir(null)} className={`p-0.5 rounded-full ${isDark ? "text-white/30" : "text-gray-400"}`}><X size={12} /></button>
                </div>
              ) : (
                <button onClick={() => { setAddingDir(sec.key); setForm({ name: "", emoji: "📋", color: COLORS[Math.floor(Math.random() * COLORS.length)] }); }} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed text-xs transition-colors ${isDark ? "border-white/10 text-white/30 hover:border-white/20 hover:text-white/50" : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500"}`}>
                  <Plus size={12} /> เพิ่ม
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
