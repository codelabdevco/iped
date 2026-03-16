"use client";

import { Wallet, Plus } from "lucide-react";

export default function BudgetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">งบประมาณ</h1>
          <p className="text-sm text-white/40 mt-1">
            ตั้งงบประมาณและติดตามการใช้จ่าย
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FA3633] rounded-lg text-sm font-medium hover:bg-[#FA3633]/90 transition-colors">
          <Plus size={16} />
          ตั้งงบประมาณ
        </button>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-xl p-12 text-center">
        <Wallet size={48} className="mx-auto text-white/20 mb-4" />
        <h3 className="text-lg font-medium text-white/60">
          ยังไม่ได้ตั้งงบประมาณ
        </h3>
        <p className="text-sm text-white/30 mt-2 max-w-md mx-auto">
          ตั้งงบประมาณรายเดือนแยกตามหมวดหมู่ เพื่อควบคุมการใช้จ่ายของคุณ
          ระบบจะแจ้งเตือนเมื่อใกล้ถึงงบที่ตั้งไว้
        </p>
      </div>
    </div>
  );
}
