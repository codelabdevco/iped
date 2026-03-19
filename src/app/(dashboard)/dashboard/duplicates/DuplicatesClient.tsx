"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReactiveData } from "@/hooks/useReactiveMode";
import { useTheme } from "@/contexts/ThemeContext";
import { Copy, Trash2, CheckCircle, AlertTriangle, Shield, ImageIcon, MessageCircle, Globe, Loader2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import BrandIcon from "@/components/dashboard/BrandIcon";
import DeleteConfirmModal from "@/components/dashboard/DeleteConfirmModal";

interface DupDoc {
  _id: string; merchant: string; amount: number; date: string;
  time: string; status: string; source: string; hasImage: boolean;
}

interface DupGroup {
  id: string; similarity: number; docs: DupDoc[];
}

export default function DuplicatesClient({ groups: initial }: { groups: DupGroup[] }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [groups, setGroups] = useReactiveData(initial);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ group: DupGroup; mode: "first" | "all" } | null>(null);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const pending = groups.filter((g) => !resolved.has(g.id));
  const resolvedCount = resolved.size;
  const totalDupDocs = groups.reduce((s, g) => s + g.docs.length, 0);

  // Keep one, delete others — show confirm first
  const handleKeepFirst = (group: DupGroup) => {
    setDeleteTarget({ group, mode: "first" });
  };

  // Keep all — mark as not duplicate (no confirm needed)
  const handleKeepAll = async (group: DupGroup) => {
    setActing(group.id);
    for (const doc of group.docs) {
      if (doc.status === "duplicate") {
        try {
          await fetch(`/api/receipts/${doc._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "confirmed" }),
          });
        } catch {}
      }
    }
    setResolved((prev) => new Set([...prev, group.id]));
    setActing(null);
    router.refresh();
  };

  // Delete all duplicates — show confirm first
  const handleDeleteAll = (group: DupGroup) => {
    setDeleteTarget({ group, mode: "all" });
  };

  const confirmDupDelete = async () => {
    if (!deleteTarget) return;
    const { group, mode } = deleteTarget;
    setActing(group.id);
    const toDelete = mode === "first" ? group.docs.slice(1) : group.docs;
    for (const doc of toDelete) {
      try {
        await fetch(`/api/receipts/${doc._id}`, { method: "DELETE" });
      } catch {}
    }
    setResolved((prev) => new Set([...prev, group.id]));
    setActing(null);
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="ตรวจเอกสารซ้ำ" description="ตรวจจับและจัดการเอกสารที่อาจซ้ำกัน" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="กลุ่มที่พบ" value={`${groups.length} กลุ่ม`} icon={<Copy size={20} />} color="text-orange-500" />
        <StatsCard label="เอกสารที่อาจซ้ำ" value={`${totalDupDocs} รายการ`} icon={<AlertTriangle size={20} />} color="text-amber-500" />
        <StatsCard label="รอจัดการ" value={`${pending.length} กลุ่ม`} icon={<Shield size={20} />} color="text-blue-500" />
        <StatsCard label="จัดการแล้ว" value={`${resolvedCount} กลุ่ม`} icon={<CheckCircle size={20} />} color="text-green-500" />
      </div>

      {groups.length === 0 ? (
        <div className={`${card} border ${border} rounded-2xl p-12 text-center`}>
          <CheckCircle size={40} className={`mx-auto mb-3 text-green-500`} />
          <p className={`text-sm font-medium ${txt}`}>ไม่พบเอกสารซ้ำ</p>
          <p className={`text-xs ${muted} mt-1`}>ระบบตรวจสอบจากร้านค้า ยอดเงิน และวันที่ที่ใกล้เคียงกัน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isResolved = resolved.has(group.id);
            const isActing = acting === group.id;
            const simColor = group.similarity >= 95 ? "text-red-500 bg-red-500/10" : group.similarity >= 85 ? "text-orange-500 bg-orange-500/10" : "text-amber-500 bg-amber-500/10";

            return (
              <div key={group.id} className={`${card} border ${border} rounded-xl overflow-hidden transition-opacity ${isResolved ? "opacity-40" : ""}`}>
                {/* Header */}
                <div className={`px-4 py-2.5 flex items-center justify-between ${isDark ? "bg-white/[0.02]" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <Copy size={14} className="text-orange-500" />
                    <span className={`text-xs font-medium ${txt}`}>
                      {group.docs.length} รายการคล้ายกัน
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${simColor}`}>{group.similarity}%</span>
                    {isResolved && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500">จัดการแล้ว</span>}
                  </div>
                  <span className={`text-xs ${muted}`}>฿{group.docs[0]?.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Docs */}
                <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6" }}>
                  {group.docs.map((doc, i) => (
                    <div key={doc._id} className={`px-4 py-2.5 flex items-center gap-3 ${i === 0 && !isResolved ? (isDark ? "bg-green-500/[0.03]" : "bg-green-50/50") : ""}`}>
                      {/* First = keep indicator */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${i === 0 ? "bg-green-500/20 text-green-500" : isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400"}`}>
                        {i === 0 ? "✓" : i + 1}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${txt}`}>{doc.merchant}</span>
                        <div className={`flex items-center gap-2 text-[11px] ${muted} mt-0.5`}>
                          <span>{doc.date}{doc.time ? ` ${doc.time}` : ""}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <BrandIcon brand={doc.source === "line" ? "line" : "web"} size={11} />
                            {doc.source === "line" ? "LINE" : "เว็บ"}
                          </span>
                          {doc.status === "duplicate" && <><span>·</span><span className="text-orange-400">สลิปซ้ำ</span></>}
                        </div>
                      </div>

                      {/* Amount */}
                      <span className={`text-sm font-semibold ${txt} shrink-0`}>฿{doc.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {!isResolved && (
                  <div className={`px-4 py-2.5 flex items-center gap-2 ${isDark ? "bg-white/[0.02]" : "bg-gray-50"}`}>
                    {isActing ? (
                      <Loader2 size={14} className="animate-spin text-[#FA3633]" />
                    ) : (
                      <>
                        <button onClick={() => handleKeepFirst(group)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors">
                          <CheckCircle size={12} /> เก็บอันแรก ลบที่เหลือ
                        </button>
                        <button onClick={() => handleKeepAll(group)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                          <Shield size={12} /> เก็บทั้งหมด
                        </button>
                        <button onClick={() => handleDeleteAll(group)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                          <Trash2 size={12} /> ลบทั้งหมด
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        receiptId={deleteTarget?.group.docs.length === 1 ? deleteTarget.group.docs[0]._id : null}
        receiptIds={deleteTarget ? (deleteTarget.mode === "first" ? deleteTarget.group.docs.slice(1).map((d) => d._id) : deleteTarget.group.docs.map((d) => d._id)) : undefined}
        onConfirm={confirmDupDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
