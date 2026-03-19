"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReactiveData } from "@/hooks/useReactiveMode";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users, UserCheck, UserPlus, Clock, Search, Pencil,
  Banknote, Shield,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import Baht from "@/components/dashboard/Baht";

interface TeamMember {
  _id: string;
  employeeCode: string;
  name: string;
  nickname: string;
  position: string;
  department: string;
  employmentType: string;
  baseSalary: number;
  bankName: string;
  email: string;
  lineUserId: string;
  startDate: string;
  status: string;
}

interface DeptInfo {
  name: string;
  count: number;
  icon: string;
}

interface Props {
  members: TeamMember[];
  departments: DeptInfo[];
  stats: { total: number; active: number; probation: number };
}

const empTypeLabel: Record<string, { label: string; cls: string }> = {
  "full-time": { label: "ประจำ", cls: "bg-blue-500/20 text-blue-400" },
  "part-time": { label: "พาร์ทไทม์", cls: "bg-purple-500/20 text-purple-400" },
  contract: { label: "สัญญาจ้าง", cls: "bg-yellow-500/20 text-yellow-400" },
  freelance: { label: "ฟรีแลนซ์", cls: "bg-orange-500/20 text-orange-400" },
};

const statusLabel: Record<string, { label: string; cls: string }> = {
  active: { label: "ทำงานอยู่", cls: "bg-green-500/20 text-green-400" },
  probation: { label: "ทดลองงาน", cls: "bg-yellow-500/20 text-yellow-400" },
  resigned: { label: "ลาออก", cls: "bg-gray-500/20 text-gray-400" },
  terminated: { label: "เลิกจ้าง", cls: "bg-red-500/20 text-red-400" },
};

export default function TeamClient({ members: initialMembers, departments, stats: initialStats }: Props) {
  const { isDark } = useTheme();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [members] = useReactiveData(initialMembers);
  const [tab, setTab] = useState<"team" | "permissions">("team");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  const statusOptions = [
    { value: "all", label: "ทุกสถานะ" },
    { value: "active", label: "ทำงานอยู่" },
    { value: "probation", label: "ทดลองงาน" },
    { value: "resigned", label: "ลาออก" },
  ];

  const deptOptions = [
    { value: "all", label: "ทุกแผนก" },
    ...departments.map((d) => ({ value: d.name, label: `${d.icon} ${d.name}` })),
  ];

  const stats = useMemo(() => {
    const active = members.filter((m) => m.status === "active").length;
    const probation = members.filter((m) => m.status === "probation").length;
    return { total: members.length, active, probation };
  }, [members]);

  const filtered = useMemo(() => {
    let data = members;
    if (statusFilter !== "all") data = data.filter((m) => m.status === statusFilter);
    if (deptFilter !== "all") data = data.filter((m) => m.department === deptFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.employeeCode.toLowerCase().includes(q) ||
        m.position.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q)
      );
    }
    return data;
  }, [members, statusFilter, deptFilter, search]);

  /* ── Team columns ── */
  const teamColumns: Column<TeamMember>[] = useMemo(() => [
    { key: "employeeCode", label: "รหัส", render: (r) => <span className="font-mono text-xs">{r.employeeCode}</span> },
    {
      key: "name", label: "ชื่อ",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.name}{r.nickname ? ` (${r.nickname})` : ""}</p>
          {r.position && r.position !== "-" && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.position}</p>}
        </div>
      ),
    },
    { key: "department", label: "แผนก" },
    {
      key: "employmentType", label: "ประเภท",
      render: (r) => {
        const t = empTypeLabel[r.employmentType] || empTypeLabel["full-time"];
        return <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${t.cls}`}>{t.label}</span>;
      },
    },
    { key: "baseSalary", label: "เงินเดือน", align: "right", render: (r) => <Baht value={r.baseSalary} /> },
    {
      key: "lineUserId", label: "แจ้งเตือน",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          {r.lineUserId && <span className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center" title="LINE"><svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg></span>}
          {r.email && <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center" title={r.email}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>}
          {!r.lineUserId && !r.email && <span className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>—</span>}
        </div>
      ),
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => {
        const st = statusLabel[r.status] || statusLabel.active;
        return <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span>;
      },
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r) => (
        <Link
          href={`/dashboard/payroll?tab=employees&edit=${r._id}`}
          className={`p-2 rounded-lg transition-colors inline-flex ${c("hover:bg-white/5 text-white/40 hover:text-blue-400", "hover:bg-gray-100 text-gray-400 hover:text-blue-500")}`}
        ><Pencil size={14} /></Link>
      ),
    },
  ], [isDark]);

  /* ── Permissions columns ── */
  const permColumns: Column<TeamMember>[] = useMemo(() => [
    { key: "employeeCode", label: "รหัส", render: (r) => <span className="font-mono text-xs">{r.employeeCode}</span> },
    {
      key: "name", label: "ชื่อ",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.name}</p>
          {r.department && r.department !== "-" && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.department}</p>}
        </div>
      ),
    },
    { key: "position", label: "ตำแหน่ง" },
    {
      key: "email", label: "อีเมล",
      render: (r) => <span className="font-mono text-xs">{r.email || "-"}</span>,
    },
    {
      key: "lineUserId", label: "LINE",
      render: (r) => r.lineUserId
        ? <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-green-500/20 text-green-400">เชื่อมแล้ว</span>
        : <span className={`text-[11px] ${c("text-white/30", "text-gray-400")}`}>ยังไม่เชื่อม</span>,
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => {
        const st = statusLabel[r.status] || statusLabel.active;
        return <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span>;
      },
    },
  ], [isDark]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      <PageHeader title="พนักงาน & แผนก" description="จัดการทีมงาน สิทธิ์การใช้งาน และแผนกในองค์กร" />

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="พนักงานทั้งหมด" value={`${stats.total} คน`} icon={<Users size={20} />} color="text-blue-500" />
        <StatsCard label="ทำงานอยู่" value={`${stats.active} คน`} icon={<UserCheck size={20} />} color="text-green-500" />
        <StatsCard label="ทดลองงาน" value={`${stats.probation} คน`} icon={<Clock size={20} />} color="text-yellow-500" />
        <StatsCard label="แผนก" value={`${departments.length} แผนก`} icon={<Users size={20} />} color="text-purple-500" />
      </div>

      {/* ── Department cards ── */}
      {departments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {departments.map((d) => (
            <button
              key={d.name}
              onClick={() => setDeptFilter(deptFilter === d.name ? "all" : d.name)}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                deptFilter === d.name
                  ? "border-[#FA3633]/50 bg-[#FA3633]/5"
                  : c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)] hover:border-white/10", "bg-white border-gray-200 hover:border-gray-300")
              }`}
            >
              <span className="text-2xl">{d.icon}</span>
              <div className="text-left">
                <p className={`font-medium text-sm ${c("text-white", "text-gray-900")}`}>{d.name}</p>
                <p className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{d.count} คน</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Search + Filter + Actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง, แผนก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`}
          />
        </div>
        <div className="w-36">
          <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        </div>
        <Link
          href="/dashboard/payroll?tab=employees"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25"
        >
          <UserPlus size={16} />เพิ่มพนักงาน
        </Link>
        <Link
          href="/dashboard/payroll"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${c("bg-white/5 text-white/70 hover:bg-white/10 border border-white/10", "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200")}`}
        >
          <Banknote size={16} />จ่ายเงินเดือน
        </Link>
      </div>

      {/* ── Tabs ── */}
      <div className={`flex gap-1 p-1 rounded-xl w-fit ${c("bg-white/[0.04]", "bg-gray-100")}`}>
        <button
          onClick={() => { setTab("team"); setSearch(""); setStatusFilter("all"); setDeptFilter("all"); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "team" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50 hover:text-white/70", "text-gray-500 hover:text-gray-700")}`}
        >
          พนักงาน
        </button>
        <button
          onClick={() => { setTab("permissions"); setSearch(""); setStatusFilter("all"); setDeptFilter("all"); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "permissions" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50 hover:text-white/70", "text-gray-500 hover:text-gray-700")}`}
        >
          <Shield size={14} className="inline mr-1.5 -mt-0.5" />สิทธิ์การใช้งาน
        </button>
      </div>

      {/* ── Tables ── */}
      {tab === "team" && (
        <DataTable
          columns={teamColumns}
          data={filtered}
          rowKey={(r) => r._id}
          emptyText="ยังไม่มีพนักงาน — กด 'เพิ่มพนักงาน' เพื่อเริ่มต้น"
          columnConfigKey="team-members"
        />
      )}
      {tab === "permissions" && (
        <DataTable
          columns={permColumns}
          data={filtered}
          rowKey={(r) => r._id}
          emptyText="ยังไม่มีพนักงาน"
          columnConfigKey="team-permissions"
        />
      )}
    </div>
  );
}
