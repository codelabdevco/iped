"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Receipt, FileText, CheckCircle, Clock, Pencil, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface ReceiptRow {
  _id: string;
  storeName: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  type: string;
  source: string;
  imageUrl?: string;
}

const statusStyle: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-400",
  pending: "bg-yellow-500/10 text-yellow-400",
  rejected: "bg-red-500/10 text-red-400",
};
const statusLabel: Record<string, string> = {
  confirmed: "ยืนยันแล้ว",
  pending: "รอตรวจสอบ",
  rejected: "ปฏิเสธ",
};
const typeLabel: Record<string, string> = {
  receipt: "ใบเสร็จ",
  invoice: "ใบแจ้งหนี้",
  billing: "บิลเรียกเก็บ",
  debit_note: "ใบเพิ่มหนี้",
  credit_note: "ใบลดหนี้",
};

export default function ReceiptsClient({ receipts }: { receipts: ReceiptRow[] }) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch = !search || r.storeName.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchType = typeFilter === "all" || r.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [receipts, search, statusFilter, typeFilter]);

  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);
  const confirmed = filtered.filter((r) => r.status === "confirmed").length;
  const pending = filtered.filter((r) => r.status === "pending").length;

  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const inputCls = isDark
    ? "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-white placeholder-white/30"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400";

  const columns: Column<ReceiptRow>[] = [
    {
      key: "image",
      label: "รูป",
      render: (r, isDark) => (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
          {r.imageUrl ? (
            <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={16} className={muted} />
          )}
        </div>
      ),
    },
    { key: "storeName", label: "ร้านค้า", render: (r) => <span className="font-medium">{r.storeName}</span> },
    { key: "type", label: "ประเภท", render: (r) => <span>{typeLabel[r.type] || r.type}</span> },
    { key: "category", label: "หมวดหมู่" },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <span className="font-semibold">฿{r.amount.toLocaleString()}</span> },
    { key: "date", label: "วันที่" },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle[r.status] || statusStyle.pending}`}>
          {statusLabel[r.status] || r.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r, isDark) => (
        <Link
          href={`/receipt/${r._id}/edit`}
          className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/40 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
        >
          <Pencil size={14} />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="ใบเสร็จทั้งหมด" description={`${filtered.length} รายการ — รวม ฿${totalAmount.toLocaleString()}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ใบเสร็จทั้งหมด" value={`${filtered.length} รายการ`} icon={<Receipt size={20} />} color="text-blue-500" />
        <StatsCard label="ยอดรวม" value={`฿${totalAmount.toLocaleString()}`} icon={<FileText size={20} />} color="text-[#FA3633]" />
        <StatsCard label="ยืนยันแล้ว" value={`${confirmed} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="รอตรวจสอบ" value={`${pending} รายการ`} icon={<Clock size={20} />} color="text-yellow-500" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub}`} />
          <input type="text" placeholder="ค้นหาร้านค้า, หมวดหมู่..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className={sub} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
            <option value="all">สถานะทั้งหมด</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="pending">รอตรวจสอบ</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
            <option value="all">ประเภททั้งหมด</option>
            <option value="receipt">ใบเสร็จ</option>
            <option value="invoice">ใบแจ้งหนี้</option>
            <option value="billing">บิลเรียกเก็บ</option>
            <option value="debit_note">ใบเพิ่มหนี้</option>
            <option value="credit_note">ใบลดหนี้</option>
          </select>
        </div>
      </div>

      <DataTable dateField="date" columns={columns} data={filtered} rowKey={(r) => r._id} />
    </div>
  );
}
