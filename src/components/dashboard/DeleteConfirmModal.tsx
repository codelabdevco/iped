"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertTriangle, Loader2, X, Trash2, FileText, ArrowRight } from "lucide-react";

interface RelationInfo {
  pages: { label: string; color: string }[];
  matches: { _id: string; otherMerchant: string; matchType: string }[];
  direction: string;
  receipt: { merchant: string; amount: number; date: string; category: string; status: string };
}

interface Props {
  open: boolean;
  receiptId: string | null;
  /** Multiple IDs for bulk delete */
  receiptIds?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

const DIR_LABEL: Record<string, string> = {
  income: "รายรับ",
  expense: "รายจ่าย",
  savings: "เงินออม",
};

export default function DeleteConfirmModal({ open, receiptId, receiptIds, onConfirm, onCancel }: Props) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<RelationInfo | null>(null);
  const [bulkCount, setBulkCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const isBulk = !!(receiptIds && receiptIds.length > 1);
  const singleId = receiptId || (receiptIds && receiptIds.length === 1 ? receiptIds[0] : null);

  useEffect(() => {
    if (!open) { setInfo(null); setBulkCount(0); return; }

    if (isBulk && receiptIds) {
      setBulkCount(receiptIds.length);
      setInfo(null);
      return;
    }

    if (!singleId) return;

    setLoading(true);
    fetch(`/api/receipts/${singleId}/relations`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setInfo(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, singleId, isBulk, receiptIds]);

  if (!open) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  const card = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const border = isDark ? "border-white/10" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className={`relative w-[440px] max-w-[95vw] ${card} rounded-2xl border ${border} shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 flex items-center gap-3 border-b ${border}`}>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-bold ${txt}`}>ยืนยันการลบ</h3>
            <p className={`text-xs ${sub}`}>
              {isBulk ? `${bulkCount} รายการที่เลือก` : "ข้อมูลนี้จะถูกลบถาวร"}
            </p>
          </div>
          <button onClick={onCancel} className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"}`}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-red-500" />
              <span className={`ml-2 text-sm ${sub}`}>กำลังตรวจสอบ...</span>
            </div>
          ) : isBulk ? (
            <div className={`rounded-xl p-4 ${isDark ? "bg-red-500/5 border border-red-500/10" : "bg-red-50 border border-red-100"}`}>
              <p className={`text-sm ${txt}`}>
                คุณกำลังจะลบ <span className="font-bold text-red-500">{bulkCount} รายการ</span>
              </p>
              <p className={`text-xs ${sub} mt-1`}>
                รายการเหล่านี้จะถูกลบออกจากทุกหน้าที่เกี่ยวข้อง รวมถึงข้อมูลจับคู่ (matches) ที่เชื่อมโยง
              </p>
            </div>
          ) : info ? (
            <>
              {/* Receipt info */}
              <div className={`rounded-xl p-3.5 ${isDark ? "bg-white/[0.03] border border-white/5" : "bg-gray-50 border border-gray-100"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${txt}`}>{info.receipt.merchant}</span>
                  <span className="text-sm font-bold text-red-500">
                    ฿{info.receipt.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={`flex items-center gap-2 mt-1 text-xs ${muted}`}>
                  <span>{info.receipt.date}</span>
                  <span>·</span>
                  <span>{info.receipt.category}</span>
                  <span>·</span>
                  <span>{DIR_LABEL[info.direction] || "รายจ่าย"}</span>
                </div>
              </div>

              {/* Where it appears */}
              <div>
                <p className={`text-xs font-semibold ${sub} mb-2`}>ข้อมูลนี้ปรากฏใน</p>
                <div className="space-y-1.5">
                  {info.pages.map((p, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: p.color }} />
                      <span className={`text-xs ${txt}`}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related matches */}
              {info.matches.length > 0 && (
                <div>
                  <p className={`text-xs font-semibold ${sub} mb-2`}>เอกสารจับคู่ที่เชื่อมโยง ({info.matches.length})</p>
                  <div className="space-y-1.5">
                    {info.matches.map((m) => (
                      <div key={m._id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-orange-500/5 border border-orange-500/10" : "bg-orange-50 border border-orange-100"}`}>
                        <FileText size={12} className="text-orange-500 shrink-0" />
                        <span className={`text-xs ${txt} truncate`}>{m.otherMerchant}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500"}`}>{m.matchType}</span>
                      </div>
                    ))}
                  </div>
                  <p className={`text-[11px] ${muted} mt-1.5`}>
                    การลบจะยกเลิกการจับคู่เหล่านี้ด้วย
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className={`rounded-xl p-4 ${isDark ? "bg-red-500/5 border border-red-500/10" : "bg-red-50 border border-red-100"}`}>
              <p className={`text-sm ${txt}`}>ต้องการลบรายการนี้?</p>
              <p className={`text-xs ${sub} mt-1`}>ข้อมูลจะถูกลบถาวรจากทุกหน้าที่เกี่ยวข้อง</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-4 flex gap-2 border-t ${border}`}>
          <button
            onClick={handleConfirm}
            disabled={deleting || loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "กำลังลบ..." : isBulk ? `ลบ ${bulkCount} รายการ` : "ยืนยันลบ"}
          </button>
          <button
            onClick={onCancel}
            disabled={deleting}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
