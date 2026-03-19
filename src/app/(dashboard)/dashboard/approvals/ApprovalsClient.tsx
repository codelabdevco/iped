"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useReactiveData } from "@/hooks/useReactiveMode";
import { useTheme } from "@/contexts/ThemeContext";
import { useModal } from "@/components/dashboard/ConfirmModal";
import {
  Check, X, Clock, CheckCircle, Search,
  Receipt, Banknote, Users, CreditCard, FileText, Loader2, ImageIcon,
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
  category: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "paid" | "rejected";
  source?: string;
  hasImage?: boolean;
  isReimbursement?: boolean;
  note?: string;
  month?: number;
  year?: number;
}

interface Props {
  expenses: ApprovalRow[];
  payrolls: ApprovalRow[];
  employeeCount: number;
}

const typeStyle: Record<string, { label: string; cls: string; icon: typeof Receipt }> = {
  expense: { label: "รายจ่าย", cls: "bg-orange-500/15 text-orange-400", icon: Receipt },
  payroll: { label: "เงินเดือน", cls: "bg-blue-500/15 text-blue-400", icon: Banknote },
};

export default function ApprovalsClient({ expenses: initialExpenses, payrolls: initialPayrolls, employeeCount }: Props) {
  const { isDark } = useTheme();
  const modal = useModal();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [expenses, setExpenses] = useReactiveData(initialExpenses);
  const [payrolls, setPayrolls] = useReactiveData(initialPayrolls);
  const [tab, setTab] = useState<"all" | "expense" | "payroll">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [acting, setActing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const allItems = useMemo(() => [...expenses, ...payrolls], [expenses, payrolls]);

  const stats = useMemo(() => ({
    pendingExpenses: expenses.filter((e) => e.status === "pending").length,
    pendingPayrolls: payrolls.filter((p) => p.status === "pending").length,
    waitingPay: allItems.filter((i) => i.status === "approved").length,
    paid: allItems.filter((i) => i.status === "paid").length,
  }), [expenses, payrolls, allItems]);

  const totalPending = stats.pendingExpenses + stats.pendingPayrolls;

  const filtered = useMemo(() => {
    let data = tab === "expense" ? expenses : tab === "payroll" ? payrolls : allItems;
    if (statusFilter !== "all") data = data.filter((d) => d.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.category.toLowerCase().includes(q));
    }
    return data.sort((a, b) => {
      const order: Record<string, number> = { pending: 0, approved: 1, paid: 2, rejected: 3 };
      if ((order[a.status] ?? 9) !== (order[b.status] ?? 9)) return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [tab, expenses, payrolls, allItems, statusFilter, search]);

  const toggleSelect = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  // ── Actions ──
  const handleAction = useCallback(async (item: ApprovalRow, action: "approve" | "pay" | "reject") => {
    setActing(item._id);
    try {
      if (item.type === "expense") {
        if (item.isReimbursement) {
          // Use reimburse API for transferred receipts
          const res = await fetch(`/api/receipts/${item._id}/reimburse`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
          if (res.ok) {
            const newStatus = action === "approve" ? "approved" : action === "pay" ? "paid" : "rejected";
            setExpenses((prev) => prev.map((e) => e._id === item._id ? { ...e, status: newStatus } as ApprovalRow : e));
            if (action === "approve") await modal.alert({ title: "อนุมัติแล้ว", message: "อนุมัติเบิกจ่าย + แจ้งเตือน LINE แล้ว", type: "success" });
            if (action === "pay") await modal.alert({ title: "จ่ายเงินสำเร็จ", message: "ส่งบิลกลับไปส่วนตัว + แจ้ง LINE แล้ว", type: "success" });
          }
        } else {
          // Regular expense approval
          const newStatus = action === "approve" ? "confirmed" : "cancelled";
          await fetch(`/api/receipts/${item._id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          setExpenses((prev) => prev.map((e) => e._id === item._id ? { ...e, status: action === "approve" ? "approved" : "rejected" } as ApprovalRow : e));
        }
      } else {
        // Payroll
        const newStatus = action === "approve" ? "approved" : action === "pay" ? "paid" : "cancelled";
        await fetch(`/api/payroll/${item._id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        setPayrolls((prev) => prev.map((p) => p._id === item._id ? { ...p, status: newStatus === "cancelled" ? "rejected" : newStatus } as ApprovalRow : p));
      }
    } catch {} finally { setActing(null); }
  }, [modal]);

  const handleBulkApprove = useCallback(async () => {
    const pendingIds = selected.filter((id) => { const r = allItems.find((x) => x._id === id); return r && r.status === "pending"; });
    if (pendingIds.length === 0) return;
    const ok = await modal.confirm({ title: "อนุมัติทั้งหมด", message: `อนุมัติ ${pendingIds.length} รายการ?` });
    if (!ok) return;
    for (const id of pendingIds) {
      const item = allItems.find((x) => x._id === id);
      if (item) await handleAction(item, "approve");
    }
    setSelected([]);
  }, [selected, allItems, modal, handleAction]);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "pending", label: "รออนุมัติ" },
    { value: "approved", label: "รอจ่ายเงิน" },
    { value: "paid", label: "จ่ายแล้ว" },
    { value: "rejected", label: "ปฏิเสธ" },
  ];

  const statusBadge = (status: string, isReimb: boolean) => {
    if (status === "pending") return <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-yellow-500/20 text-yellow-400">{isReimb ? "รอเบิกจ่าย" : "รออนุมัติ"}</span>;
    if (status === "approved") return <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-blue-500/20 text-blue-400">รอจ่ายเงิน</span>;
    if (status === "paid") return <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-green-500/20 text-green-400">จ่ายแล้ว</span>;
    if (status === "rejected") return <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-red-500/20 text-red-400">ปฏิเสธ</span>;
    return null;
  };

  const columns: Column<ApprovalRow>[] = useMemo(() => [
    {
      key: "select" as any, label: "", configurable: false,
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); toggleSelect(r._id); }} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selected.includes(r._id) ? "bg-[#FA3633] border-[#FA3633]" : isDark ? "border-white/20 hover:border-white/40" : "border-gray-300 hover:border-gray-400"}`}>
          {selected.includes(r._id) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>
      ),
    },
    {
      key: "image" as any, label: "รูป", configurable: false,
      render: (r) => {
        if (r.type !== "expense" || !r.hasImage) return <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}><ImageIcon size={14} className={isDark ? "text-white/20" : "text-gray-300"} /></div>;
        return <img src={`/api/receipts/image?id=${r._id}`} alt="" className="w-10 h-10 rounded-lg object-cover" loading="lazy" />;
      },
    },
    {
      key: "type", label: "ประเภท",
      render: (r) => {
        const t = typeStyle[r.type];
        const Icon = t.icon;
        return <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${t.cls}`}><Icon size={12} />{r.isReimbursement ? "เบิกจ่าย" : t.label}</span>;
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
    {
      key: "category", label: "หมวดหมู่",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.category || "-"}</span>,
    },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} /> },
    {
      key: "date", label: "วันที่",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "-"}</span>,
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => statusBadge(r.status, !!r.isReimbursement),
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r, dark) => {
        if (acting === r._id) return <Loader2 size={14} className="animate-spin text-white/40" />;
        if (r.status === "pending") return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => handleAction(r, "approve")} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
              <Check className="w-3 h-3 inline mr-1" />อนุมัติ
            </button>
            <button onClick={() => handleAction(r, "reject")} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
              <X className="w-3 h-3 inline mr-1" />ปฏิเสธ
            </button>
          </div>
        );
        if (r.status === "approved") return (
          <button onClick={() => handleAction(r, "pay")} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
            <CreditCard className="w-3 h-3 inline mr-1" />อนุมัติจ่าย
          </button>
        );
        if (r.status === "paid") return <span className={`text-[11px] text-green-400`}>จ่ายแล้ว</span>;
        return <span className={`text-[11px] ${c("text-white/30", "text-gray-400")}`}>—</span>;
      },
    },
  ], [acting, selected, isDark, handleAction]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      <PageHeader title="อนุมัติรายจ่าย & เงินเดือน" description="อนุมัติ จ่ายเงิน และส่งบิลกลับไปยังผู้ขอเบิก" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="รออนุมัติ" value={`${totalPending} รายการ`} icon={<Clock size={20} />} color={totalPending > 0 ? "text-yellow-500" : "text-green-500"} />
        <StatsCard label="รอจ่ายเงิน" value={`${stats.waitingPay} รายการ`} icon={<CreditCard size={20} />} color="text-blue-500" />
        <StatsCard label="จ่ายแล้ว" value={`${stats.paid} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="พนักงาน" value={`${employeeCount} คน`} icon={<Users size={20} />} color="text-purple-500" />
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Link href="/business/dashboard/reimbursement" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${c("bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.06]", "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200")}`}>
          <Receipt size={14} />ค่าใช้จ่ายบริษัท
        </Link>
        <Link href="/business/dashboard/payroll" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${c("bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.06]", "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200")}`}>
          <Banknote size={14} />จ่ายเงินเดือน
        </Link>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${c("bg-white/[0.04] border border-white/[0.06]", "bg-gray-50 border border-gray-200")}`}>
          <span className={`text-sm font-medium ${c("text-white", "text-gray-900")}`}>เลือก {selected.length} รายการ</span>
          <button onClick={handleBulkApprove} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
            <CheckCircle size={12} /> อนุมัติที่เลือก
          </button>
          <button onClick={() => setSelected([])} className={`text-xs ${c("text-white/40", "text-gray-400")}`}>ยกเลิก</button>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-36"><Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} /></div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl w-fit ${c("bg-white/[0.04]", "bg-gray-100")}`}>
        <button onClick={() => { setTab("all"); setSearch(""); setSelected([]); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "all" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50 hover:text-white/70", "text-gray-500 hover:text-gray-700")}`}>
          ทั้งหมด {totalPending > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400">{totalPending}</span>}
        </button>
        <button onClick={() => { setTab("expense"); setSearch(""); setSelected([]); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "expense" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50 hover:text-white/70", "text-gray-500 hover:text-gray-700")}`}>
          <Receipt size={14} className="inline mr-1.5 -mt-0.5" />รายจ่าย
        </button>
        <button onClick={() => { setTab("payroll"); setSearch(""); setSelected([]); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "payroll" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50 hover:text-white/70", "text-gray-500 hover:text-gray-700")}`}>
          <Banknote size={14} className="inline mr-1.5 -mt-0.5" />เงินเดือน
        </button>
      </div>

      <DataTable columns={columns} data={filtered} rowKey={(r) => r._id} dateField="date" emptyText="ไม่มีรายการ" columnConfigKey="approvals" />
    </div>
  );
}
