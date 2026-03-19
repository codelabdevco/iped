"use client";

import { useState, useMemo, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useModal } from "@/components/dashboard/ConfirmModal";
import {
  Crown, Users, CreditCard, Search, Loader2, Gift,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";

interface SubRow {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageName: string;
  packageTier: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string;
  receiptsUsed: number;
  ocrUsed: number;
  createdAt: string;
}

interface Props {
  subs: SubRow[];
  packages: { value: string; label: string }[];
  stats: { total: number; free: number; paid: number; trial: number };
}

const tierStyle: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-400",
  plus: "bg-blue-500/20 text-blue-400",
  pro: "bg-purple-500/20 text-purple-400",
  starter: "bg-teal-500/20 text-teal-400",
  business: "bg-orange-500/20 text-orange-400",
  enterprise: "bg-red-500/20 text-red-400",
};

const statusStyle: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  trial: "bg-blue-500/20 text-blue-400",
  past_due: "bg-yellow-500/20 text-yellow-400",
  cancelled: "bg-gray-500/20 text-gray-400",
  expired: "bg-red-500/20 text-red-400",
};

export default function SubsClient({ subs: initial, packages, stats }: Props) {
  const { isDark } = useTheme();
  const modal = useModal();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [subs, setSubs] = useState(initial);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [changing, setChanging] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let data = subs;
    if (tierFilter !== "all") data = data.filter((s) => s.packageTier === tierFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((s) => s.userName.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q));
    }
    return data;
  }, [subs, tierFilter, search]);

  const handleChangePlan = useCallback(async (userId: string, newTier: string) => {
    const ok = await modal.confirm({ title: "เปลี่ยนแพ็กเกจ", message: `เปลี่ยนเป็น ${newTier.toUpperCase()} ?` });
    if (!ok) return;
    setChanging(userId);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, packageTier: newTier }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch {} finally { setChanging(null); }
  }, [modal]);

  const tierOptions = [{ value: "all", label: "ทั้งหมด" }, ...packages];

  const columns: Column<SubRow>[] = useMemo(() => [
    {
      key: "userName", label: "ผู้ใช้",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.userName}</p>
          {r.userEmail && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.userEmail}</p>}
        </div>
      ),
    },
    {
      key: "packageTier", label: "แพ็กเกจ",
      render: (r) => <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${tierStyle[r.packageTier] || tierStyle.free}`}>{r.packageName}</span>,
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${statusStyle[r.status] || statusStyle.active}`}>{r.status}</span>,
    },
    {
      key: "receiptsUsed", label: "ใช้งาน",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.receiptsUsed} ใบเสร็จ • {r.ocrUsed} OCR</span>,
    },
    {
      key: "currentPeriodEnd", label: "หมดอายุ",
      render: (r) => r.currentPeriodEnd ? <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{new Date(r.currentPeriodEnd).toLocaleDateString("th-TH")}</span> : <span className={c("text-white/30", "text-gray-400")}>—</span>,
    },
    {
      key: "actions", label: "เปลี่ยนแพ็กเกจ", configurable: false,
      render: (r) => changing === r.userId ? <Loader2 size={14} className="animate-spin" /> : (
        <div className="w-32">
          <Select
            value={r.packageTier}
            onChange={(v) => handleChangePlan(r.userId, v)}
            options={packages}
          />
        </div>
      ),
    },
  ], [changing, handleChangePlan, packages, isDark]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      <PageHeader title="จัดการ Subscription" description="ดูและเปลี่ยนแพ็กเกจของผู้ใช้ทั้งหมด" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ทั้งหมด" value={`${stats.total} คน`} icon={<Users size={20} />} color="text-blue-500" />
        <StatsCard label="Free" value={`${stats.free} คน`} icon={<Crown size={20} />} color="text-gray-500" />
        <StatsCard label="Paid" value={`${stats.paid} คน`} icon={<CreditCard size={20} />} color="text-green-500" />
        <StatsCard label="Trial" value={`${stats.trial} คน`} icon={<Gift size={20} />} color="text-blue-500" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหาชื่อ, อีเมล..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-44">
          <Select value={tierFilter} onChange={setTierFilter} options={tierOptions} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} rowKey={(r) => r._id} dateField="createdAt" emptyText="ไม่มี subscription" columnConfigKey="admin-subs" />
    </div>
  );
}
