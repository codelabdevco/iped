"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Clock, CheckCircle, XCircle, Search, ImageIcon, CreditCard, Banknote,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import Select from "@/components/dashboard/Select";
import Baht from "@/components/dashboard/Baht";

interface ClaimRow {
  _id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  hasImage: boolean;
  bizStatus: string;
  bizNote: string;
  companyNote: string;
  hasCompanySlip: boolean;
  bizReceiptId: string;
}

export default function MyClaimsClient({ claims: initial }: { claims: ClaimRow[] }) {
  const { isDark } = useTheme();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [claims] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = useMemo(() => ({
    pending: claims.filter((r) => r.bizStatus === "pending").length,
    approved: claims.filter((r) => r.bizStatus === "confirmed").length,
    paid: claims.filter((r) => r.bizStatus === "paid").length,
    rejected: claims.filter((r) => r.bizStatus === "cancelled").length,
  }), [claims]);

  const filtered = useMemo(() => {
    let data = claims;
    if (statusFilter !== "all") data = data.filter((r) => r.bizStatus === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.merchant.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    return data;
  }, [claims, statusFilter, search]);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "pending", label: "รอเบิกจ่าย" },
    { value: "confirmed", label: "อนุมัติแล้ว รอจ่าย" },
    { value: "paid", label: "จ่ายแล้ว" },
    { value: "cancelled", label: "ปฏิเสธ" },
  ];

  const columns: Column<ClaimRow>[] = useMemo(() => [
    {
      key: "image" as any, label: "รูป", configurable: false,
      render: (r) => r.hasImage
        ? <img src={`/api/receipts/image?id=${r._id}`} alt="" className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
        : <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}><ImageIcon size={14} className={isDark ? "text-white/20" : "text-gray-300"} /></div>,
    },
    {
      key: "merchant", label: "รายการ",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.merchant}</p>
          {r.category && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.category}</p>}
        </div>
      ),
    },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} /> },
    {
      key: "date", label: "ส่งเมื่อ",
      render: (r) => r.date ? <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</span> : <span className={c("text-white/30", "text-gray-400")}>-</span>,
    },
    {
      key: "bizStatus", label: "สถานะจากบริษัท",
      render: (r) => {
        if (r.bizStatus === "pending") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-orange-500/10 text-orange-400">รอเบิกจ่าย</span>;
        if (r.bizStatus === "confirmed") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-500/10 text-blue-400">อนุมัติแล้ว รอจ่าย</span>;
        if (r.bizStatus === "paid") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-400">จ่ายแล้ว</span>;
        if (r.bizStatus === "cancelled") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400">ปฏิเสธ</span>;
        return <span className="text-[11px] text-gray-400">{r.bizStatus}</span>;
      },
    },
    {
      key: "companyNote" as any, label: "หมายเหตุ / เอกสารจากบริษัท",
      render: (r) => {
        const refMatch = (r.bizNote || "").match(/ref:\s*(\S+)/);
        return (
          <div className="space-y-1">
            {r.companyNote && <p className={`text-xs ${c("text-white/60", "text-gray-600")}`}>{r.companyNote}</p>}
            {r.bizStatus === "paid" && refMatch && <p className={`text-[11px] ${c("text-white/40", "text-gray-500")}`}>Ref: {refMatch[1]}</p>}
            {r.hasCompanySlip && (
              <a href={`/api/receipts/company-slip?id=${r.bizReceiptId}`} target="_blank" className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                <ImageIcon size={11} />ดูสลิปจากบริษัท
              </a>
            )}
            {r.bizStatus === "cancelled" && <p className="text-xs text-red-400">ปฏิเสธ</p>}
            {!r.companyNote && !r.hasCompanySlip && r.bizStatus !== "cancelled" && !(r.bizStatus === "paid" && refMatch) && <span className={c("text-white/30", "text-gray-400")}>—</span>}
          </div>
        );
      },
    },
  ], [isDark]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      <PageHeader title="สถานะเบิกจ่าย" description="ติดตามรายการที่ส่งเบิกจ่ายไปยังบริษัท" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="รอเบิกจ่าย" value={`${stats.pending} รายการ`} icon={<Clock size={20} />} color="text-orange-500" />
        <StatsCard label="อนุมัติแล้ว รอจ่าย" value={`${stats.approved} รายการ`} icon={<CreditCard size={20} />} color="text-blue-500" />
        <StatsCard label="จ่ายแล้ว" value={`${stats.paid} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="ปฏิเสธ" value={`${stats.rejected} รายการ`} icon={<XCircle size={20} />} color="text-red-500" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-44"><Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} /></div>
      </div>

      <DataTable columns={columns} data={filtered} rowKey={(r) => r._id} dateField="date" emptyText="ยังไม่มีรายการเบิกจ่าย — ส่งใบเสร็จไปบริษัทได้จากหน้าใบเสร็จ/เอกสาร" columnConfigKey="my-claims" />
    </div>
  );
}
