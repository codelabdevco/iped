"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReactiveData } from "@/hooks/useReactiveMode";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Check, X, Clock, CheckCircle, AlertTriangle, Search,
  Receipt, Banknote, ArrowRightLeft, Loader2,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import Select from "@/components/dashboard/Select";
import Baht from "@/components/dashboard/Baht";

interface ReimbursementRow {
  _id: string;
  merchant: string;
  category: string;
  categoryIcon: string;
  amount: number;
  date: string;
  status: string;
  source: string;
  note: string;
}

interface Props {
  receipts: ReimbursementRow[];
  stats: {
    totalPending: number;
    totalAmount: number;
    totalApproved: number;
    totalRejected: number;
  };
}

const statusStyle: Record<string, { label: string; cls: string }> = {
  pending: { label: "รอเบิก", cls: "bg-yellow-500/20 text-yellow-400" },
  confirmed: { label: "อนุมัติ", cls: "bg-green-500/20 text-green-400" },
  cancelled: { label: "ปฏิเสธ", cls: "bg-red-500/20 text-red-400" },
};

export default function ReimbursementClient({ receipts: initialReceipts, stats }: Props) {
  const { isDark } = useTheme();
  const router = useRouter();
  const c = (d: string, l: string) => (isDark ? d : l);

  const [receipts, setReceipts] = useReactiveData(initialReceipts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [acting, setActing] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let data = [...receipts];
    if (statusFilter !== "all") data = data.filter((d) => d.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((d) => d.merchant.toLowerCase().includes(q) || d.category.toLowerCase().includes(q));
    }
    return data.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [receipts, statusFilter, search]);

  const handleAction = useCallback(async (item: ReimbursementRow, action: "approve" | "reject") => {
    setActing(item._id);
    try {
      const newStatus = action === "approve" ? "confirmed" : "cancelled";
      const res = await fetch(`/api/receipts/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReceipts((prev) =>
          prev.map((r) =>
            r._id === item._id ? { ...r, status: newStatus } : r
          )
        );
      }
    } catch {} finally {
      setActing(null);
    }
  }, []);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "pending", label: "รอเบิก" },
    { value: "confirmed", label: "อนุมัติ" },
    { value: "cancelled", label: "ปฏิเสธ" },
  ];

  const columns: Column<ReimbursementRow>[] = useMemo(() => [
    {
      key: "merchant", label: "ร้านค้า",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.merchant}</p>
          {r.category && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.categoryIcon} {r.category}</p>}
        </div>
      ),
    },
    {
      key: "amount", label: "จำนวนเงิน", align: "right",
      render: (r) => <Baht value={r.amount} />,
    },
    {
      key: "date", label: "วันที่",
      render: (r) => (
        <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>
          {r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "-"}
        </span>
      ),
    },
    {
      key: "submittedBy", label: "ผู้ขอเบิก",
      render: () => (
        <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>ฉัน</span>
      ),
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => {
        const st = statusStyle[r.status] || { label: r.status, cls: "bg-gray-500/20 text-gray-400" };
        return <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span>;
      },
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r, dark) => r.status === "pending" ? (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {acting === r._id ? (
            <Loader2 size={14} className="animate-spin text-white/40" />
          ) : (
            <>
              <button
                onClick={() => handleAction(r, "approve")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
              ><Check className="w-3 h-3 inline mr-1" />อนุมัติ</button>
              <button
                onClick={() => handleAction(r, "reject")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
              ><X className="w-3 h-3 inline mr-1" />ปฏิเสธ</button>
            </>
          )}
        </div>
      ) : (
        <Link
          href={`/dashboard/receipts?edit=${r._id}`}
          className={`text-[11px] ${c("text-white/40 hover:text-blue-400", "text-gray-400 hover:text-blue-500")} transition-colors`}
        >ดูรายละเอียด</Link>
      ),
    },
  ], [acting, handleAction, isDark]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      <PageHeader title="เบิกจ่าย" description="จัดการการเบิกจ่ายค่าใช้จ่ายส่วนตัวเข้าบริษัท" />

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="รอเบิกจ่าย"
          value={`${stats.totalPending} รายการ`}
          icon={<Clock size={20} />}
          color={stats.totalPending > 0 ? "text-yellow-500" : "text-green-500"}
        />
        <StatsCard
          label="ยอดรอเบิก"
          value={<Baht value={stats.totalAmount} />}
          icon={<Banknote size={20} />}
          color="text-orange-500"
        />
        <StatsCard
          label="อนุมัติแล้ว"
          value={`${stats.totalApproved} รายการ`}
          icon={<CheckCircle size={20} />}
          color="text-green-500"
        />
        <StatsCard
          label="ปฏิเสธ"
          value={`${stats.totalRejected} รายการ`}
          icon={<AlertTriangle size={20} />}
          color="text-red-500"
        />
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input
            type="text"
            placeholder="ค้นหาร้านค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`}
          />
        </div>
        <div className="w-36">
          <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        </div>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r._id}
        dateField="date"
        emptyText="ไม่มีรายการเบิกจ่าย"
        columnConfigKey="reimbursement"
      />
    </div>
  );
}
