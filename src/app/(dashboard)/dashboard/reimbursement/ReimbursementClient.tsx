"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useModal } from "@/components/dashboard/ConfirmModal";
import {
  Clock, CheckCircle, XCircle, Search, Loader2, CreditCard, Banknote, Upload, X,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import Baht from "@/components/dashboard/Baht";

interface ReceiptRow {
  _id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  source: string;
  note: string;
  direction: string;
  hasImage: boolean;
}

export default function ReimbursementClient({ receipts: initial }: { receipts: ReceiptRow[] }) {
  const { isDark } = useTheme();
  const modal = useModal();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [receipts, setReceipts] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [acting, setActing] = useState<string | null>(null);

  // Pay modal state
  const [payTarget, setPayTarget] = useState<ReceiptRow | null>(null);
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);

  const isFromPersonal = (r: ReceiptRow) => (r.note || "").includes("ค่าใช้จ่ายบริษัท จากส่วนตัว");

  const stats = useMemo(() => ({
    pending: receipts.filter((r) => isFromPersonal(r) && r.status === "pending").length,
    pendingAmount: receipts.filter((r) => isFromPersonal(r) && r.status === "pending").reduce((s, r) => s + r.amount, 0),
    waitingPay: receipts.filter((r) => isFromPersonal(r) && r.status === "confirmed").length,
    paid: receipts.filter((r) => isFromPersonal(r) && r.status === "paid").length,
  }), [receipts]);

  const filtered = useMemo(() => {
    let data = receipts.filter(isFromPersonal);
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.merchant.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    return data;
  }, [receipts, statusFilter, search]);

  // ── Actions ──
  const handleApprove = useCallback(async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/receipts/${id}/reimburse`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        setReceipts((prev) => prev.map((r) => r._id === id ? { ...r, status: "confirmed" } : r));
        await modal.alert({ title: "อนุมัติแล้ว", message: "อนุมัติเบิกจ่ายแล้ว ระบบแจ้งเตือนไปยังผู้ขอเบิกแล้ว", type: "success" });
      }
    } catch {} finally { setActing(null); }
  }, [modal]);

  const handleReject = useCallback(async (id: string) => {
    const ok = await modal.confirm({ title: "ปฏิเสธเบิกจ่าย", message: "ต้องการปฏิเสธรายการนี้?" });
    if (!ok) return;
    setActing(id);
    try {
      await fetch(`/api/receipts/${id}/reimburse`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      setReceipts((prev) => prev.map((r) => r._id === id ? { ...r, status: "cancelled" } : r));
    } catch {} finally { setActing(null); }
  }, [modal]);

  const openPayModal = (r: ReceiptRow) => {
    setPayTarget(r);
    setPayRef("");
    setPayNote("");
  };

  const handlePay = useCallback(async () => {
    if (!payTarget) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/receipts/${payTarget._id}/reimburse`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay", bankTransferRef: payRef, note: payNote }),
      });
      if (res.ok) {
        setReceipts((prev) => prev.map((r) => r._id === payTarget._id ? { ...r, status: "paid" } : r));
        setPayTarget(null);
        await modal.alert({ title: "จ่ายเงินสำเร็จ", message: "จ่ายเงินเบิกจ่ายแล้ว ระบบส่งบิลกลับไปยังส่วนตัวของผู้ขอเบิก + แจ้งเตือน LINE แล้ว", type: "success" });
      }
    } catch {} finally { setPaying(false); }
  }, [payTarget, payRef, payNote, modal]);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "pending", label: "รอเบิกจ่าย" },
    { value: "confirmed", label: "รอจ่ายเงิน" },
    { value: "paid", label: "จ่ายแล้ว" },
    { value: "cancelled", label: "ปฏิเสธ" },
  ];

  const columns: Column<ReceiptRow>[] = useMemo(() => [
    {
      key: "merchant", label: "รายการ",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.merchant}</p>
          <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.category}</p>
        </div>
      ),
    },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} /> },
    {
      key: "date", label: "ส่งเข้ามาเมื่อ",
      render: (r) => {
        if (!r.date) return <span className={c("text-white/30", "text-gray-400")}>-</span>;
        const d = new Date(r.date);
        return <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })} {d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>;
      },
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => {
        if (r.status === "pending") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-orange-500/10 text-orange-400">รอเบิกจ่าย</span>;
        if (r.status === "confirmed") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-500/10 text-blue-400">รอจ่ายเงิน</span>;
        if (r.status === "paid") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-400">จ่ายแล้ว</span>;
        if (r.status === "cancelled") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400">ปฏิเสธ</span>;
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-500/10 text-gray-400">{r.status}</span>;
      },
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r, dark) => {
        if (acting === r._id) return <Loader2 size={14} className="animate-spin text-white/40" />;
        if (r.status === "pending") return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => handleApprove(r._id)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
              <CheckCircle size={12} className="inline mr-1" />อนุมัติ
            </button>
            <button onClick={() => handleReject(r._id)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
              <XCircle size={12} className="inline mr-1" />ปฏิเสธ
            </button>
          </div>
        );
        if (r.status === "confirmed") return (
          <button onClick={() => openPayModal(r)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
            <CreditCard size={12} className="inline mr-1" />จ่ายเงิน
          </button>
        );
        return <span className={`text-[11px] ${c("text-white/30", "text-gray-400")}`}>—</span>;
      },
    },
  ], [handleApprove, handleReject, acting, isDark]);

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
                  <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>จ่ายเงินเบิกจ่าย</h2>
                  <p className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{payTarget.merchant}</p>
                </div>
              </div>

              {/* Amount */}
              <div className={`rounded-xl ${cardBg} border p-4 text-center`}>
                <p className={`text-xs ${c("text-white/40", "text-gray-500")}`}>ยอดที่ต้องจ่าย</p>
                <p className="text-2xl font-bold text-green-400 mt-1">฿{payTarget.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
              </div>

              {/* Bank transfer ref */}
              <div>
                <label className={lbl}>เลขอ้างอิงการโอน / Ref</label>
                <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="เช่น 2026031900001" className={inp} />
              </div>

              {/* Note */}
              <div>
                <label className={lbl}>หมายเหตุ</label>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" className={inp} />
              </div>

              <p className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>
                เมื่อกดจ่ายเงิน ระบบจะ: อัพเดทสถานะเป็น "จ่ายแล้ว" + ส่งบิลกลับไปยังส่วนตัวของผู้ขอเบิก + แจ้งเตือน LINE
              </p>

              <div className="flex gap-2 pt-2">
                <button onClick={handlePay} disabled={paying} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {paying ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                  {paying ? "กำลังจ่าย..." : "ยืนยันจ่ายเงิน"}
                </button>
                <button onClick={() => setPayTarget(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      <PageHeader title="ค่าใช้จ่ายบริษัท" description="จัดการค่าใช้จ่ายที่ส่งมาจากส่วนตัว — อนุมัติ จ่ายเงิน และส่งบิลกลับ" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="รอเบิกจ่าย" value={`${stats.pending} รายการ`} icon={<Clock size={20} />} color="text-orange-500" />
        <StatsCard label="ยอดรอเบิก" value={`฿${stats.pendingAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Banknote size={20} />} color="text-yellow-500" />
        <StatsCard label="รอจ่ายเงิน" value={`${stats.waitingPay} รายการ`} icon={<CreditCard size={20} />} color="text-blue-500" />
        <StatsCard label="จ่ายแล้ว" value={`${stats.paid} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหาร้านค้า, หมวดหมู่..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-40">
          <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r._id}
        dateField="date"
        emptyText="ยังไม่มีค่าใช้จ่ายบริษัทที่ส่งมาจากส่วนตัว"
        columnConfigKey="reimbursement"
      />
    </div>
  );
}
