"use client";

import { FileText } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function DocumentsPage() {
  const { isDark } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">เอกสาร</h1>
        <p className="text-sm text-white/40 mt-1">
          จัดการเอกสารทางการเงินทั้งหมดของคุณ
        </p>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-xl p-12 text-center">
        <FileText size={48} className="mx-auto text-white/20 mb-4" />
        <h3 className="text-lg font-medium text-white/60">
          ระบบจัดการเอกสารจะพร้อมใช้งานเร็วๆ นี้
        </h3>
        <p className="text-sm text-white/30 mt-2 max-w-md mx-auto">
          จัดเก็บใบกำกับภาษี ใบเสร็จรับเงิน ใบแจ้งหนี้ และเอกสารอื่นๆ
          อย่างเป็นระบบ พร้อมค้นหาและส่งออกได้ง่าย
        </p>
      </div>
    </div>
  );
}
