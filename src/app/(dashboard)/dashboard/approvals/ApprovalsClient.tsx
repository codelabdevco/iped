"use client";

import { useState, useMemo, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useModal } from "@/components/dashboard/ConfirmModal";
import {
  Check, X, Clock, CheckCircle, CreditCard, Search, Loader2, ImageIcon, Banknote,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import Select from "@/components/dashboard/Select";
import Baht from "@/components/dashboard/Baht";

interface ItemRow {
  _id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "paid" | "rejected";
  source: string;
  hasImage: boolean;
  isReimbursement: boolean;
  note: string;
}

export default function ApprovalsClient({ items: initial }: { items: ItemRow[] }) {
  const { isDark } = useTheme();
  const modal = useModal();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [acting, setActing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  // Pay modal
  const [payTarget, setPayTarget] = useState<ItemRow | null>(null);
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payCompanyNote, setPayCompanyNote] = useState("");
  const [paySlip, setPaySlip] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const stats = useMemo(() => ({
    pending: items.filter((r) => r.status === "pending").length,
    waitingPay: items.filter((r) => r.status === "approved").length,
    paid: items.filter((r) => r.status === "paid").length,
    rejected: items.filter((r) => r.status === "rejected").length,
  }), [items]);

  const filtered = useMemo(() => {
    let data = items;
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    const order: Record<string, number> = { pending: 0, approved: 1, paid: 2, rejected: 3 };
    return data.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [items, statusFilter, search]);

  const toggleSelect = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const handleAction = useCallback(async (id: string, action: "approve" | "reject") => {
    setActing(id);
    const item = items.find((r) => r._id === id);
    try {
      if (item?.isReimbursement) {
        await fetch(`/api/receipts/${id}/reimburse`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      } else {
        const statusMap: Record<string, string> = { approve: "confirmed", reject: "cancelled" };
        await fetch(`/api/receipts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: statusMap[action] }) });
      }
      if (action === "approve" && item?.isReimbursement) {
        await modal.alert({ title: "อนุมัติแล้ว", message: "แจ้งเตือน LINE ไปยังผู้ขอเบิกแล้ว", type: "success" });
      }
      // Reload to get fresh data (stats, badges, moved items)
      window.location.reload();
    } catch {} finally { setActing(null); }
  }, [items, modal]);

  const handlePay = useCallback(async () => {
    if (!payTarget) return;
    setPaying(true);
    try {
      if (payTarget.isReimbursement) {
        await fetch(`/api/receipts/${payTarget._id}/reimburse`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pay", bankTransferRef: payRef, note: payNote, companyNote: payCompanyNote, slipImage: paySlip }),
        });
      } else {
        await fetch(`/api/receipts/${payTarget._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) });
      }
      setPayTarget(null); setPaySlip(null);
      await modal.alert({ title: "จ่ายเงินสำเร็จ", message: payTarget.isReimbursement ? "ส่งบิล+เอกสาร+หมายเหตุกลับไปส่วนตัว + แจ้ง LINE แล้ว" : "อัพเดทสถานะจ่ายแล้ว", type: "success" });
      window.location.reload();
    } catch {} finally { setPaying(false); }
  }, [payTarget, payRef, payNote, payCompanyNote, paySlip, modal]);

  const handleBulkApprove = useCallback(async () => {
    const pendingIds = selected.filter((id) => items.find((r) => r._id === id)?.status === "pending");
    if (!pendingIds.length) return;
    const ok = await modal.confirm({ title: "อนุมัติทั้งหมด", message: `อนุมัติ ${pendingIds.length} รายการ?` });
    if (!ok) return;
    for (const id of pendingIds) await handleAction(id, "approve");
    setSelected([]);
  }, [selected, items, modal, handleAction]);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "pending", label: "รออนุมัติ" },
    { value: "approved", label: "รอจ่ายเงิน" },
    { value: "paid", label: "จ่ายแล้ว" },
    { value: "rejected", label: "ปฏิเสธ" },
  ];

  const columns: Column<ItemRow>[] = useMemo(() => [
    { key: "select" as any, label: "", configurable: false, render: (r) => <button onClick={(e) => { e.stopPropagation(); toggleSelect(r._id); }} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selected.includes(r._id) ? "bg-[#FA3633] border-[#FA3633]" : isDark ? "border-white/20 hover:border-white/40" : "border-gray-300 hover:border-gray-400"}`}>{selected.includes(r._id) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}</button> },
    { key: "image" as any, label: "รูป", configurable: false, render: (r) => r.hasImage ? <img src={`/api/receipts/image?id=${r._id}`} alt="" className="w-10 h-10 rounded-lg object-cover" loading="lazy" /> : <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}><ImageIcon size={14} className={isDark ? "text-white/20" : "text-gray-300"} /></div> },
    { key: "name", label: "รายการ", render: (r) => <div><p className="font-medium text-sm">{r.name}</p>{r.isReimbursement && <p className="text-[10px] text-orange-400">เบิกจ่ายจากส่วนตัว</p>}</div> },
    { key: "category", label: "หมวดหมู่", render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.category || "-"}</span> },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} /> },
    { key: "date", label: "วันที่", render: (r) => r.date ? <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</span> : <span className={c("text-white/30", "text-gray-400")}>-</span> },
    { key: "status", label: "สถานะ", render: (r) => {
      const isR = r.isReimbursement;
      if (r.status === "pending") return <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-yellow-500/20 text-yellow-400">{isR ? "รอเบิกจ่าย" : "รออนุมัติ"}</span>;
      if (r.status === "approved") return <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-blue-500/20 text-blue-400">รอจ่ายเงิน</span>;
      if (r.status === "paid") return <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-green-500/20 text-green-400">จ่ายแล้ว</span>;
      return <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-red-500/20 text-red-400">ปฏิเสธ</span>;
    }},
    { key: "actions", label: "จัดการ", configurable: false, render: (r, dark) => {
      if (acting === r._id) return <Loader2 size={14} className="animate-spin text-white/40" />;
      if (r.status === "pending") return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleAction(r._id, "approve")} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${dark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-600 hover:bg-green-100"}`}><Check className="w-3 h-3 inline mr-1" />อนุมัติ</button>
          <button onClick={() => handleAction(r._id, "reject")} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${dark ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-red-50 text-red-600 hover:bg-red-100"}`}><X className="w-3 h-3 inline mr-1" />ปฏิเสธ</button>
        </div>
      );
      if (r.status === "approved") return (
        <button onClick={() => { setPayTarget(r); setPayRef(""); setPayNote(""); }} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${dark ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}><CreditCard className="w-3 h-3 inline mr-1" />อนุมัติจ่าย</button>
      );
      if (r.status === "paid") return <span className="text-[11px] text-green-400">จ่ายแล้ว</span>;
      return <span className={`text-[11px] ${c("text-white/30", "text-gray-400")}`}>—</span>;
    }},
  ], [acting, selected, isDark, handleAction]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");
  const inp = `w-full h-9 px-3 ${c("bg-white/5 border-white/10 text-white", "bg-gray-50 border-gray-200 text-gray-900")} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`;
  const lbl = `block text-xs ${c("text-white/40", "text-gray-500")} mb-1`;
  const panelBg = c("bg-[#0a0a0a] border-white/10", "bg-white border-gray-200");
  const cardBg = c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200");

  return (
    <div className="space-y-6">
      {/* ── Pay Modal ── */}
      {payTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setPayTarget(null)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><CreditCard size={20} className="text-blue-400" /></div>
                <div>
                  <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>อนุมัติจ่ายเงิน</h2>
                  <p className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{payTarget.name} • {payTarget.category}</p>
                </div>
              </div>
              <div className={`rounded-xl ${cardBg} border p-4 text-center`}>
                <p className={`text-xs ${c("text-white/40", "text-gray-500")}`}>ยอดที่ต้องจ่าย</p>
                <p className="text-2xl font-bold text-green-400 mt-1">฿{payTarget.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
              </div>
              {payTarget.hasImage && (
                <div>
                  <label className={lbl}>เอกสารแนบ</label>
                  <img src={`/api/receipts/image?id=${payTarget._id}`} alt="" className="w-full max-h-40 object-contain rounded-lg border border-white/10" />
                </div>
              )}
              <div><label className={lbl}>เลขอ้างอิงการโอน / Ref</label><input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="เช่น 2026031900001" className={inp} /></div>
              <div>
                <label className={lbl}>แนบสลิปโอนเงิน / เอกสาร</label>
                {paySlip ? (
                  <div className="relative">
                    <img src={paySlip} alt="" className="w-full max-h-40 object-contain rounded-lg border border-white/10" />
                    <button onClick={() => setPaySlip(null)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white"><X size={12} /></button>
                  </div>
                ) : (
                  <label className={`flex items-center justify-center gap-2 h-20 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${isDark ? "border-white/10 hover:border-white/20 text-white/40" : "border-gray-200 hover:border-gray-300 text-gray-400"}`}>
                    <Banknote size={16} />
                    <span className="text-xs">คลิกเพื่อแนบสลิป</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setPaySlip(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                )}
              </div>
              <div><label className={lbl}>หมายเหตุจากบริษัท (ส่งกลับไปส่วนตัว)</label><textarea value={payCompanyNote} onChange={(e) => setPayCompanyNote(e.target.value)} placeholder="เช่น จ่ายเข้าบัญชี xxx แล้ว, ไม่สามารถเบิกรายการ xxx ได้..." rows={2} className={`${inp} h-auto py-2`} /></div>
              <div><label className={lbl}>หมายเหตุภายใน (ไม่ส่งกลับ)</label><input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="memo ภายในบริษัท (ไม่บังคับ)" className={inp} /></div>
              <p className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>กดอนุมัติจ่าย → ส่งบิล + สลิป + หมายเหตุกลับไปส่วนตัว + แจ้งเตือน LINE</p>
              <div className="flex gap-2 pt-2">
                <button onClick={handlePay} disabled={paying} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {paying ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}{paying ? "กำลังดำเนินการ..." : "อนุมัติจ่ายเงิน"}
                </button>
                <button onClick={() => setPayTarget(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      <PageHeader title="อนุมัติรายจ่าย" description="อนุมัติ จ่ายเงิน และส่งบิลพร้อมเอกสารกลับไปยังผู้ขอ" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="รออนุมัติ" value={`${stats.pending} รายการ`} icon={<Clock size={20} />} color={stats.pending > 0 ? "text-yellow-500" : "text-green-500"} />
        <StatsCard label="รอจ่ายเงิน" value={`${stats.waitingPay} รายการ`} icon={<CreditCard size={20} />} color="text-blue-500" />
        <StatsCard label="จ่ายแล้ว" value={`${stats.paid} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="ปฏิเสธ" value={`${stats.rejected} รายการ`} icon={<X size={20} />} color="text-red-500" />
      </div>

      {selected.length > 0 && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${c("bg-white/[0.04] border border-white/[0.06]", "bg-gray-50 border border-gray-200")}`}>
          <span className={`text-sm font-medium ${c("text-white", "text-gray-900")}`}>เลือก {selected.length} รายการ</span>
          <button onClick={handleBulkApprove} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-green-50 text-green-600 hover:bg-green-100"}`}><CheckCircle size={12} /> อนุมัติที่เลือก</button>
          <button onClick={() => setSelected([])} className={`text-xs ${c("text-white/40", "text-gray-400")}`}>ยกเลิก</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหาร้านค้า, หมวดหมู่..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-36"><Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} /></div>
      </div>

      <DataTable columns={columns} data={filtered} rowKey={(r) => r._id} dateField="date" emptyText="ไม่มีรายการ" columnConfigKey="approvals" />
    </div>
  );
}
