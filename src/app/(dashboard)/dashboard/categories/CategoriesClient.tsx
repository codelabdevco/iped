"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Tag, Hash, Layers, TrendingDown, TrendingUp, PiggyBank } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

interface CategoryItem {
  name: string;
  count: number;
  total: number;
  direction: string;
}

const COLORS: Record<string, string> = {
  "อาหาร": "#FB923C", "เดินทาง": "#60A5FA", "ช็อปปิ้ง": "#818CF8",
  "สาธารณูปโภค": "#F472B6", "ของใช้ในบ้าน": "#C084FC", "สุขภาพ": "#34D399",
  "การศึกษา": "#FBBF24", "บันเทิง": "#F87171", "ที่พัก": "#A78BFA",
  "คมนาคม": "#38BDF8", "ธุรกิจ": "#F59E0B", "เงินเดือน": "#22c55e",
  "ฟรีแลนซ์": "#3b82f6", "ขายของ": "#f59e0b", "ลงทุน": "#8b5cf6",
  "โบนัส": "#ec4899", "คืนเงิน": "#14b8a6", "ดอกเบี้ย": "#06b6d4",
  "ท่องเที่ยว": "#818CF8", "ซื้อของ": "#FB923C", "กองทุนฉุกเฉิน": "#34D399",
  "เกษียณ": "#F472B6", "บ้าน/รถ": "#60A5FA", "เงินออม": "#ec4899",
};
const FALLBACK = ["#818CF8","#FB923C","#60A5FA","#F472B6","#C084FC","#34D399","#FBBF24","#F87171"];
function getColor(name: string, i: number) { return COLORS[name] || FALLBACK[i % FALLBACK.length]; }

function Baht({ value, className = "" }: { value: number; className?: string }) {
  const whole = Math.floor(Math.abs(value)).toLocaleString();
  const dec = (Math.abs(value) % 1).toFixed(2).slice(1);
  return <span className={className}>฿{whole}<span className="text-[0.75em] opacity-50">{dec}</span></span>;
}

export default function CategoriesClient({ categories }: { categories: CategoryItem[] }) {
  const { isDark } = useTheme();
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const expense = categories.filter((d) => d.direction === "expense");
  const income = categories.filter((d) => d.direction === "income");
  const savings = categories.filter((d) => d.direction === "savings");
  const totalCount = categories.reduce((s, d) => s + d.count, 0);
  const totalExpense = expense.reduce((s, d) => s + d.total, 0);
  const totalIncome = income.reduce((s, d) => s + d.total, 0);

  const renderSection = (items: CategoryItem[], label: string, icon: React.ReactNode, accentColor: string, maxTotal: number) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: accentColor }}>{icon}</span>
        <h3 className={`text-sm font-semibold ${sub}`}>{label}</h3>
        <span className={`text-xs ${muted}`}>({items.length} หมวด)</span>
      </div>
      {items.length === 0 ? (
        <div className={`${card} border ${border} rounded-xl p-6 text-center ${muted} text-sm`}>ยังไม่มีข้อมูล</div>
      ) : (
        <div className="space-y-2">
          {items.map((cat, i) => {
            const color = getColor(cat.name, i);
            const pct = maxTotal > 0 ? (cat.total / maxTotal) * 100 : 0;
            return (
              <div key={cat.name} className={`${card} border ${border} rounded-xl px-4 py-3 flex items-center gap-4`}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${txt}`}>{cat.name}</span>
                    <Baht value={cat.total} className={`text-sm font-semibold ${txt}`} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className={`text-[10px] ${muted} w-16 text-right`}>{cat.count} รายการ</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="หมวดหมู่" description="ภาพรวมหมวดหมู่จากใบเสร็จทั้งหมด" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="หมวดหมู่ทั้งหมด" value={`${categories.length} หมวด`} icon={<Tag size={20} />} color="text-blue-500" />
        <StatsCard label="รายการทั้งหมด" value={`${totalCount} รายการ`} icon={<Hash size={20} />} color="text-green-500" />
        <StatsCard label="รายจ่ายรวม" value={`฿${totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingDown size={20} />} color="text-[#FA3633]" />
        <StatsCard label="รายรับรวม" value={`฿${totalIncome.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingUp size={20} />} color="text-green-500" />
      </div>

      <div className="space-y-8">
        {renderSection(expense, "หมวดรายจ่าย", <TrendingDown size={16} />, "#FA3633", Math.max(...expense.map((e) => e.total), 1))}
        {renderSection(income, "หมวดรายรับ", <TrendingUp size={16} />, "#22c55e", Math.max(...income.map((e) => e.total), 1))}
        {savings.length > 0 && renderSection(savings, "หมวดเงินออม", <PiggyBank size={16} />, "#ec4899", Math.max(...savings.map((e) => e.total), 1))}
      </div>
    </div>
  );
}
