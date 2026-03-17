"use client";
import { BarChart3 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";

export default function ReportsPage() {
  const { isDark } = useTheme();
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  return (
    <div className="space-y-6">
      <PageHeader title="สรุป & Trend" description="วิเคราะห์และสรุปรายจ่ายรายรับของคุณ" />
      <div className={`${card} border ${border} rounded-2xl p-12 text-center`}>
        <BarChart3 size={48} className={`mx-auto ${sub} mb-4`} />
        <h3 className={`text-lg font-medium ${sub}`}>สรุปรายงานจะพร้อมใช้งานเร็วๆ นี้</h3>
        <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"} mt-2 max-w-md mx-auto`}>ดูสรุปรายจ่ายรายวัน รายสัปดาห์ รายเดือน พร้อมกราฟวิเคราะห์แนวโน้มและส่งออกรายงาน</p>
      </div>
    </div>
  );
}
