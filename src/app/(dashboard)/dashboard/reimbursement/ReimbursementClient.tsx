"use client";

import { useState, useMemo, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useModal } from "@/components/dashboard/ConfirmModal";
import {
  Clock, CheckCircle, XCircle, Search, Loader2,
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

  const isFromPersonal = (r: ReceiptRow) => (r.note || "").includes("ค่าใช้จ่ายบริษัท จากส่วนตัว");

  const stats = useMemo(() => ({
    pending: receipts.filter((r) => isFromPersonal(r) && r.status === "pending").length,
    pendingAmount: receipts.filter((r) => isFromPersonal(r) && r.status === "pending").reduce((s, r) => s + r.amount, 0),
    approved: receipts.filter((r) => isFromPersonal(r) && r.status === "confirmed").length,
    rejected: receipts.filter((r) => isFromPersonal(r) && r.status === "cancelled").length,
  }), [receipts]);

  const filtered = useMemo(() => {
    // Show only transferred receipts
    let data = receipts.filter(isFromPersonal);
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.merchant.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    return data;
  }, [receipts, statusFilter, search]);

  const handleAction = useCallback(async (id: string, action: "approve" | "reject") => {
    const newStatus = action === "approve" ? "confirmed" : "cancelled";
    try {
      await fetch(`/api/receipts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setReceipts((prev) => prev.map((r) => r._id === id ? { ...r, status: newStatus } : r));
    } catch {}
  }, []);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "pending", label: "รอเบิกจ่าย" },
    { value: "confirmed", label: "เบิกจ่ายสำเร็จ" },
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
        if (r.status === "confirmed") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-400">เบิกจ่ายสำเร็จ</span>;
        if (r.status === "cancelled") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400">ปฏิเสธ</span>;
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-500/10 text-gray-400">{r.status}</span>;
      },
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r, dark) => r.status === "pending" ? (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleAction(r._id, "approve")} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
            <CheckCircle size={12} className="inline mr-1" />อนุมัติ
          </button>
          <button onClick={() => handleAction(r._id, "reject")} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
            <XCircle size={12} className="inline mr-1" />ปฏิเสธ
          </button>
        </div>
      ) : <span className={`text-[11px] ${c("text-white/30", "text-gray-400")}`}>—</span>,
    },
  ], [handleAction, isDark]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      <PageHeader title="ค่าใช้จ่ายบริษัท" description="จัดการค่าใช้จ่ายที่ส่งมาจากส่วนตัว — อนุมัติหรือปฏิเสธการเบิกจ่าย" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="รอเบิกจ่าย" value={`${stats.pending} รายการ`} icon={<Clock size={20} />} color="text-orange-500" />
        <StatsCard label="ยอดรอเบิก" value={`฿${stats.pendingAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Clock size={20} />} color="text-yellow-500" />
        <StatsCard label="เบิกจ่ายสำเร็จ" value={`${stats.approved} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="ปฏิเสธ" value={`${stats.rejected} รายการ`} icon={<XCircle size={20} />} color="text-red-500" />
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
