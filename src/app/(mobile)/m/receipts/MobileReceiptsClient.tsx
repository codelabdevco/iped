"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import BrandIcon from "@/components/dashboard/BrandIcon";
import { formatNumber as fmt } from "@/lib/utils";

interface ReceiptItem {
  _id: string;
  merchant: string;
  amount: number;
  category: string;
  categoryIcon: string;
  direction: string;
  paymentMethod: string;
  date: string;
  time: string;
  status: string;
  source: string;
  hasImage: boolean;
}

export default function MobileReceiptsClient({ receipts }: { receipts: ReceiptItem[] }) {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const filtered = filter === "all" ? receipts : receipts.filter((r) => r.direction === filter);
  const statusLabel: Record<string, { text: string; cls: string }> = {
    pending: { text: "รอยืนยัน", cls: "bg-amber-500/10 text-amber-500" },
    confirmed: { text: "ยืนยันแล้ว", cls: "bg-green-500/10 text-green-500" },
    duplicate: { text: "ซ้ำ", cls: "bg-blue-500/10 text-blue-500" },
  };

  return (
    <div className="space-y-4 pt-2">
      <p className={`text-lg font-bold ${txt}`}>ใบเสร็จ</p>

      {/* Filter tabs */}
      <div className={`flex p-1 rounded-xl ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
        {([["all", "ทั้งหมด"], ["expense", "รายจ่าย"], ["income", "รายรับ"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${filter === key ? "bg-[#FA3633] text-white shadow-sm" : isDark ? "text-white/50" : "text-gray-500"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Receipt list */}
      <div className="space-y-2">
        {filtered.map((r) => {
          const isIncome = r.direction === "income";
          const st = statusLabel[r.status] || statusLabel.pending;
          return (
            <div key={r._id} className={`${card} border ${border} rounded-xl px-4 py-3 flex items-center gap-3`}>
              {r.paymentMethod && r.paymentMethod.startsWith("bank-") ? (
                <BrandIcon brand={r.paymentMethod} size={36} className="rounded-lg" />
              ) : r.paymentMethod === "promptpay" ? (
                <BrandIcon brand="promptpay" size={36} className="rounded-lg" />
              ) : (
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                  {r.categoryIcon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${txt} truncate`}>{r.merchant}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] ${muted}`}>{r.date}</span>
                  {r.source === "line" && <BrandIcon brand="line" size={10} />}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${st.cls}`}>{st.text}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isIncome ? "text-green-500" : txt}`}>
                  {isIncome ? "+" : "-"}฿{fmt(r.amount)}
                </p>
                <p className={`text-[10px] ${muted}`}>{r.category}</p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className={`text-center py-12 ${sub}`}>
            <p className="text-sm">ไม่มีรายการ</p>
          </div>
        )}
      </div>
    </div>
  );
}
