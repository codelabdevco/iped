"use client";

import { BarChart3 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function SummaryPage() {
  const { isDark } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">สรุปรายงาน</h1>
        <p className="text-sm text-white/40 mt-1">
          วิเคราะห์และสรุปรายรับ-รายจ่ายของคุณ
        </p>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-xl p-12 text-center">
        <BarChart3 size={48} className="mx-auto text-white/20 mb-4" />
        <h3 className="text-lg font-medium text-white/60">
          สรุปรายงานจะพร้อมใช้งานเร็วๆ นี้
        </h3>
        <p className="text-sm text-white/30 mt-2 max-w-md mx-auto">
          ดูสรุปรายรับ-รายจ่ายแบบรายวัน รายสัปดาห์ และรายเดือน
          พร้อมกราฟวิเคราะห์แนวโน้มและส่งออกรายงาน
        </p>
      </div>
    </div>
  );
}
