"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Tag, Hash, Layers, Pencil, Trash2, X, Check } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

interface CategoryItem {
  id: number; name: string; emoji: string; color: string; count: number; total: number; type: "expense" | "income";
}

const INIT: CategoryItem[] = [
  { id: 1, name: "อาหาร", emoji: "🍜", color: "#FB923C", count: 24, total: 8750, type: "expense" },
  { id: 2, name: "เดินทาง", emoji: "🚗", color: "#60A5FA", count: 15, total: 5200, type: "expense" },
  { id: 3, name: "ช้อปปิ้ง", emoji: "🛒", color: "#A78BFA", count: 8, total: 12400, type: "expense" },
  { id: 4, name: "สาธารณูปโภค", emoji: "💡", color: "#F472B6", count: 6, total: 4300, type: "expense" },
  { id: 5, name: "สุขภาพ", emoji: "🏥", color: "#34D399", count: 4, total: 7800, type: "expense" },
  { id: 6, name: "บันเทิง", emoji: "🎬", color: "#FBBF24", count: 10, total: 3200, type: "expense" },
  { id: 7, name: "การศึกษา", emoji: "📚", color: "#818CF8", count: 3, total: 2500, type: "expense" },
  { id: 8, name: "เงินเดือน", emoji: "💰", color: "#4ADE80", count: 2, total: 90000, type: "income" },
  { id: 9, name: "ฟรีแลนซ์", emoji: "💻", color: "#C084FC", count: 5, total: 37000, type: "income" },
  { id: 10, name: "ลงทุน", emoji: "📈", color: "#2DD4BF", count: 3, total: 11700, type: "income" },
  { id: 11, name: "อื่นๆ", emoji: "📦", color: "#94A3B8", count: 7, total: 4500, type: "expense" },
];

export default function CategoriesPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const expenseCats = data.filter(d => d.type === "expense");
  const incomeCats = data.filter(d => d.type === "income");
  const totalReceipts = data.reduce((s, d) => s + d.count, 0);

  const handleDelete = (id: number) => setData(prev => prev.filter(d => d.id !== id));

  const renderGrid = (items: CategoryItem[], label: string) => (
    <div>
      <h3 className={`text-sm font-medium ${sub} mb-3`}>{label}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(cat => (
          <div key={cat.id} className={`${card} border ${border} rounded-2xl p-5 group transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{cat.emoji}</div>
                <div>
                  <h4 className={`font-medium ${txt}`}>{cat.name}</h4>
                  <p className={`text-xs ${sub} mt-0.5`}>{cat.count} รายการ</p>
                </div>
              </div>
              <button onClick={() => handleDelete(cat.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/10">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-lg font-semibold ${txt}`}>฿{cat.total.toLocaleString()}</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="หมวดหมู่" description="จัดการหมวดหมู่ใบเสร็จของคุณ" onClear={() => setData([])} actionLabel="เพิ่มหมวดหมู่" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="หมวดหมู่ทั้งหมด" value={`${data.length} หมวด`} icon={<Tag size={20} />} color="text-blue-500" />
        <StatsCard label="ใบเสร็จที่จัดหมวดแล้ว" value={`${totalReceipts} รายการ`} icon={<Hash size={20} />} color="text-green-500" />
        <StatsCard label="รายจ่าย / รายรับ" value={`${expenseCats.length} / ${incomeCats.length}`} icon={<Layers size={20} />} color="text-purple-500" />
      </div>

      <div className="space-y-6">
        {renderGrid(expenseCats, "หมวดหมู่รายจ่าย")}
        {renderGrid(incomeCats, "หมวดหมู่รายรับ")}
      </div>
    </div>
  );
}
