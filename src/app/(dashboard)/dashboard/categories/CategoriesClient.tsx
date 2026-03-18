"use client";

import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";

interface CategoryItem { name: string; count: number; total: number; direction: string; }

const DIR = { expense: { label: "รายจ่าย", color: "#FA3633" }, income: { label: "รายรับ", color: "#22c55e" }, savings: { label: "เงินออม", color: "#ec4899" } };

export default function CategoriesClient({ categories }: { categories: CategoryItem[] }) {
  const { isDark } = useTheme();
  const sub = isDark ? "text-white/40" : "text-gray-400";
  const txt = isDark ? "text-white" : "text-gray-900";
  const total = categories.reduce((s, d) => s + d.total, 0);
  const maxTotal = Math.max(...categories.map((c) => c.total), 1);

  return (
    <div className="space-y-5">
      <PageHeader title="หมวดหมู่" description={`${categories.length} หมวดที่ใช้ · ฿${total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} />

      {categories.length === 0 ? (
        <p className={`text-sm ${sub} py-12 text-center`}>ยังไม่มีข้อมูล — เริ่มเพิ่มใบเสร็จเพื่อดูหมวดหมู่</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => {
            const dir = (DIR as any)[cat.direction] || DIR.expense;
            const pct = (cat.total / maxTotal) * 100;
            return (
              <div key={cat.name + cat.direction} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? "bg-white/[0.03] hover:bg-white/[0.05]" : "bg-white hover:bg-gray-50"} transition-colors`}>
                <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: dir.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${txt}`}>{cat.name}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: dir.color + "18", color: dir.color }}>{dir.label}</span>
                    </div>
                    <span className={`text-sm font-semibold ${txt}`}>฿{cat.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: dir.color, opacity: 0.6 }} />
                    </div>
                    <span className={`text-[10px] ${sub} shrink-0`}>{cat.count} รายการ</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
