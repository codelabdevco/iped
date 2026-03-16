"use client";
import { BarChart3 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ReportsPage() {
  const { isDark } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">สรุปรายงาน</h1>
        <p className={`text-sm ${isDark ? "text-white/40" : "text-gray-500"} mt-1`}>
          วิเคราะห์และสรุปรายจ่ายรายรับของคุณ
        </p>
      </div>

      <div className={`${isDark ? "bg-[#111111] border-white/[0.03]" : "bg-white border-gray-200 shadow-sm"} border rounded-xl p-12 text-center`}>
        <BarChart3 size={48} className={`mx-auto ${isDark ? "text-white/20" : "text-gray-300"} mb-4`} />
        <h3 className={`text-lg font-medium ${isDark ? "text-white/60" : "text-gray-600"}`}>
          สรุปรายงานจะพร้อมใช้งานเร็วๆ นี้
        </h3>
        <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"} mt-2 max-w-md mx-auto`}>
          ดูสรุปรายจ่ายรายวัน รายสัปดาห์ และรายเดือน พร้อมกราฟวิเคราะห์
          แนวโน้มและส่งออกรายงาน
        </p>
      </div>
    </div>
  );
}
