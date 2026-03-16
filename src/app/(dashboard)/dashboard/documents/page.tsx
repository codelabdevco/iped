"use client";
import { FileText } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function DocumentsPage() {
  const { isDark } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">เอกสาร</h1>
        <p className={`text-sm ${isDark ? "text-white/40" : "text-gray-500"} mt-1`}>
          ระบบจัดการเอกสารจะพร้อมใช้งานเร็วๆ นี้
        </p>
      </div>

      <div className={`${isDark ? "bg-[#111111] border-white/[0.015]" : "bg-white border-gray-200 shadow-sm"} border rounded-xl p-12 text-center`}>
        <FileText size={48} className={`mx-auto ${isDark ? "text-white/20" : "text-gray-300"} mb-4`} />
        <h3 className={`text-lg font-medium ${isDark ? "text-white/60" : "text-gray-600"}`}>
          ระบบจัดการเอกสารจะพร้อมใช้งานเร็วๆ นี้
        </h3>
        <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"} mt-2 max-w-md mx-auto`}>
          จัดเก็บใบกำกับภาษี ใบสั่งจ่ายเงิน ใบแจ้งหนี้ และเอกสารอื่นๆ
          อย่างเป็นระบบ พร้อมค้นหาและส่งออกได้ง่าย
        </p>
      </div>
    </div>
  );
}
