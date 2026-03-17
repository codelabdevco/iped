"use client";
import { Wallet } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";

export default function BudgetPage() {
  const { isDark } = useTheme();
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  return (
    <div className="space-y-6">
      <PageHeader title="งบประมาณ" description="ตั้งงบประมาณและติดตามการใช้จ่าย" actionLabel="ตั้งงบประมาณ" />
      <div className={`${card} border ${border} rounded-2xl p-12 text-center`}>
        <Wallet size={48} className={`mx-auto ${sub} mb-4`} />
        <h3 className={`text-lg font-medium ${sub}`}>ยังไม่ได้ตั้งงบประมาณ</h3>
        <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"} mt-2 max-w-md mx-auto`}>ตั้งงบประมาณแยกตามหมวดหมู่ เพื่อควบคุมการใช้จ่าย ระบบจะแจ้งเตือนเมื่อใกล้ถึงวงเงินที่ตั้งไว้</p>
      </div>
    </div>
  );
}
