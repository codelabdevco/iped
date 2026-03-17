"use client";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";

const defaultCategories = [
  { name: "อาหาร", emoji: "🍜", count: 0 },
  { name: "เดินทาง", emoji: "🚗", count: 0 },
  { name: "ช้อปปิ้ง", emoji: "🛒", count: 0 },
  { name: "สาธารณูปโภค", emoji: "💡", count: 0 },
  { name: "สุขภาพ", emoji: "🏥", count: 0 },
  { name: "บันเทิง", emoji: "🎬", count: 0 },
  { name: "การศึกษา", emoji: "📚", count: 0 },
  { name: "อื่นๆ", emoji: "📦", count: 0 },
];

export default function CategoriesPage() {
  const { isDark } = useTheme();
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  return (
    <div className="space-y-6">
      <PageHeader title="หมวดหมู่" description="จัดการหมวดหมู่ใบเสร็จของคุณ" actionLabel="เพิ่มหมวดหมู่" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {defaultCategories.map((cat) => (
          <div key={cat.name} className={`${card} border ${border} rounded-2xl p-5 transition-colors cursor-pointer ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
            <div className="text-3xl mb-3">{cat.emoji}</div>
            <h3 className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{cat.name}</h3>
            <p className={`text-sm ${sub} mt-1`}>{cat.count} รายการ</p>
          </div>
        ))}
      </div>
    </div>
  );
}
