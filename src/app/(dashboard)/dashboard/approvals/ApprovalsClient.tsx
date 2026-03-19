"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReactiveData } from "@/hooks/useReactiveMode";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Check, X, Clock, CheckCircle, AlertTriangle, Search,
  Receipt, Banknote, Users, CreditCard, FileText, Loader2,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import Select from "@/components/dashboard/Select";
import Baht from "@/components/dashboard/Baht";

interface ApprovalRow {
  _id: string;
  type: "expense" | "payroll";
  name: string;
  description: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  source?: string;
  month?: number;
  year?: number;
}

interface Props {
  expenses: ApprovalRow[];
  payrolls: ApprovalRow[];
  employeeCount: number;
}

const statusStyle: Record<string, { label: string; cls: string }> = {
  pending: { label: "รออนุมัติ", cls: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "อนุมัติแล้ว", cls: "bg-green-500/20 text-green-400" },
  rejected: { label: "ปฏิเสธ", cls: "bg-red-500/20 text-red-400" },
};

const typeStyle: Record<string, { label: string; cls: string; icon: typeof Receipt }> = {
  expense: { label: "รายจ่าย", cls: "bg-orange-500/15 text-orange-400", icon: Receipt },
  payroll: { label: "เงินเดือน", cls: "bg-blue-500/15 text-blue-400", icon: Banknote },
};

export default function ApprovalsClient({ expenses: initialExpenses, payrolls: initialPayrolls, employeeCount }: Props) {
  const { isDark } = useTheme();
  const router = useRouter();
  const c = (d: string, l: string) => (isDark ? d : l);

  const [expenses, setExpenses] = useReactiveData(initialExpenses);
  const [payrolls, setPayrolls] = useReactiveData(initialPayrolls);

  const [tab, setTab] = useState<"all" | "expense" | "payroll">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [acting, setActing] = useState<string | null>(null);

  const allItems = useMemo(() => [...expenses, ...payrolls], [expenses, payrolls]);

  const stats = useMemo(() => ({
    pendingExpenses: expenses.filter((e) => e.status === "pending").length,
    pendingPayrolls: payrolls.filter((p) => p.status === "pending").length,
    approved: allItems.filter((i) => i.status === "approved").length,
    rejected: allItems.filter((i) => i.status === "rejected").length,
  }), [expenses, payrolls, allItems]);

  const totalPending = stats.pendingExpenses + stats.pendingPayrolls;

  const filtered = useMemo(() => {
    let data = tab === "expense" ? expenses : tab === "payroll" ? payrolls : allItems;
    if (statusFilter !== "all") data = data.filter((d) => d.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    return data.sort((a, b) => {
      // pending first
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [tab, expenses, payrolls, allItems, statusFilter, search]);

  const handleAction = useCallback(async (item: ApprovalRow, action: "approve" | "reject") => {
    setActing(item._id);
    try {
      if (item.type === "expense") {
        const newStatus = action === "approve" ? "confirmed" : "cancelled";
        const res = await fetch(`/api/receipts/${item._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          setExpenses((prev) => prev.map((e) => e._id === item._id ? { ...e, status: action === "approve" ? "approved" : "rejected" } : e));
        }
      } else {
        const newStatus = action === "approve" ? "approved" : "cancelled";
        const res = await fetch(`/api/payroll/${item._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          setPayrolls((prev) => prev.map((p) => p._id === item._id ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p));
        }
      }
    } catch {} finally { setActing(null); }
  }, []);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "pending", label: "รออนุมัติ" },
    { value: "approved", label: "อนุมัติแล้ว" },
    { value: "rejected", label: "ปฏิเสธ" },
  ];

  const columns: Column<ApprovalRow>[] = useMemo(() => [
    {
      key: "type", label: "ประเภท",
      render: (r) => {
        const t = typeStyle[r.type];
        const Icon = t.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${t.cls}`}>
            <Icon size={12} />{t.label}
          </span>
        );
      },
    },
    {
      key: "name", label: "รายการ",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.name}</p>
          {r.description && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.description}</p>}
        </div>
      ),
    },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} /> },
    {
      key: "date", label: "วันที่",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "-"}</span>,
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => {
        const st = statusStyle[r.status];
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
          href={r.type === "payroll" ? "/dashboard/payroll" : `/dashboard/receipts?edit=${r._id}`}
          className={`text-[11px] ${c("text-white/40 hover:text-blue-400", "text-gray-400 hover:text-blue-500")} transition-colors`}
        >ดูรายละเอียด</Link>
      ),
    },
  ], [acting, handleAction, isDark]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      <PageHeader title="อนุมัติรายจ่าย & เงินเดือน" description="จัดการ workflow อนุมัติรายจ่ายและเงินเดือนพนักงาน" />

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="รออนุมัติทั้งหมด"
          value={`${totalPending} รายการ`}
          icon={<Clock size={20} />}
          color={totalPending > 0 ? "text-yellow-500" : "text-green-500"}
        />
        <StatsCard label="รายจ่ายรออนุมัติ" value={`${stats.pendingExpenses} รายการ`} icon={<Receipt size={20} />} color="text-orange-500" />
        <StatsCard label="เงินเดือนรออนุมัติ" value={`${stats.pendingPayrolls} รายการ`} icon={<Banknote size={20} />} color="text-blue-500" />
        <StatsCard label="อนุมัติแล้ว" value={`${stats.approved} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
      </div>

      {/* ── Quick links ── */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/team"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${c("bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.06]", "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200")}`}
        >
          <Users size={14} />พนักงาน {employeeCount} คน
        </Link>
        <Link
          href="/dashboard/payroll"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${c("bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.06]", "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200")}`}
        >
          <CreditCard size={14} />จ่ายเงินเดือน
        </Link>
        <Link
          href="/dashboard/receipts"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${c("bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.06]", "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200")}`}
        >
          <FileText size={14} />ใบเสร็จ/เอกสาร
        </Link>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหารายการ..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-36">
          <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={`flex gap-1 p-1 rounded-xl w-fit ${c("bg-white/[0.04]", "bg-gray-100")}`}>
        <button onClick={() => { setTab("all"); setSearch(""); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "all" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50 hover:text-white/70", "text-gray-500 hover:text-gray-700")}`}>
          ทั้งหมด {totalPending > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400">{totalPending}</span>}
        </button>
        <button onClick={() => { setTab("expense"); setSearch(""); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "expense" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50 hover:text-white/70", "text-gray-500 hover:text-gray-700")}`}>
          <Receipt size={14} className="inline mr-1.5 -mt-0.5" />รายจ่าย {stats.pendingExpenses > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-orange-500/20 text-orange-400">{stats.pendingExpenses}</span>}
        </button>
        <button onClick={() => { setTab("payroll"); setSearch(""); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "payroll" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50 hover:text-white/70", "text-gray-500 hover:text-gray-700")}`}>
          <Banknote size={14} className="inline mr-1.5 -mt-0.5" />เงินเดือน {stats.pendingPayrolls > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400">{stats.pendingPayrolls}</span>}
        </button>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r._id}
        dateField="date"
        emptyText={tab === "all" ? "ไม่มีรายการรออนุมัติ" : tab === "expense" ? "ไม่มีรายจ่ายรออนุมัติ" : "ไม่มีเงินเดือนรออนุมัติ"}
        columnConfigKey="approvals"
      />
    </div>
  );
}
