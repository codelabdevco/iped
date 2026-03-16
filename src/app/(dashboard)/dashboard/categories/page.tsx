"use client";

import { FolderOpen, Plus } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">หมวดหมู่</h1>
          <p className="text-sm text-white/40 mt-1">
            จัดการหมวดหมู่ใบเสร็จของคุณ
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FA3633] rounded-lg text-sm font-medium hover:bg-[#FA3633]/90 transition-colors">
          <Plus size={16} />
          เพิ่มหมวดหมู่
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {defaultCategories.map((cat) => (
          <div
            key={cat.name}
            className="bg-[#111111] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer"
          >
            <div className="text-3xl mb-3">{cat.emoji}</div>
            <h3 className="font-medium">{cat.name}</h3>
            <p className="text-sm text-white/40 mt-1">{cat.count} รายการ</p>
          </div>
        ))}
      </div>
    </div>
  );
}
