"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useReactiveData } from "@/hooks/useReactiveMode";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users, UserPlus, Receipt, ShieldCheck, Search,
  Pencil, Trash2, X, Loader2, Check, Ban, UserCheck,
  Clock, AlertTriangle,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
// inline delete modal used below

interface UserRow {
  _id: string;
  name: string;
  email: string;
  lineUserId: string;
  lineDisplayName: string;
  lineProfilePic: string;
  role: string;
  accountType: string;
  status: string;
  onboardingComplete: boolean;
  lastLogin: string;
  loginCount: number;
  documentsCount: number;
  occupation: string;
  phone: string;
  createdAt: string;
}

interface Props {
  currentUserId: string;
  stats: { totalUsers: number; newMonth: number; totalReceipts: number; active: number; suspended: number };
  users: UserRow[];
}

const ROLES = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "user", label: "User" },
];

const STATUSES = [
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ไม่ใช้งาน" },
  { value: "suspended", label: "ระงับ" },
  { value: "pending", label: "รอดำเนินการ" },
];

const ACCOUNT_TYPES = [
  { value: "personal", label: "ส่วนตัว" },
  { value: "business", label: "บริษัท" },
];

const roleStyle: Record<string, string> = {
  superadmin: "bg-red-500/20 text-red-400",
  admin: "bg-purple-500/20 text-purple-400",
  manager: "bg-blue-500/20 text-blue-400",
  accountant: "bg-teal-500/20 text-teal-400",
  user: "bg-gray-500/20 text-gray-400",
};

const statusStyle: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  inactive: "bg-gray-500/20 text-gray-400",
  suspended: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
};

const defaultForm = { name: "", email: "", role: "user", accountType: "personal", status: "active", occupation: "", phone: "" };

export default function AdminClient({ currentUserId, stats: initialStats, users: initialUsers }: Props) {
  const { isDark } = useTheme();
  const router = useRouter();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [users, setUsers] = useReactiveData(initialUsers);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    newMonth: initialStats.newMonth,
    totalReceipts: initialStats.totalReceipts,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  }), [users, initialStats]);

  const filtered = useMemo(() => {
    let data = users;
    if (roleFilter !== "all") data = data.filter((u) => u.role === roleFilter);
    if (statusFilter !== "all") data = data.filter((u) => u.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.lineDisplayName.toLowerCase().includes(q));
    }
    return data;
  }, [users, roleFilter, statusFilter, search]);

  const roleFilterOptions = [{ value: "all", label: "ทุกสิทธิ์" }, ...ROLES];
  const statusFilterOptions = [{ value: "all", label: "ทุกสถานะ" }, ...STATUSES];

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowPanel(true);
  };

  const openEdit = (u: UserRow) => {
    setEditingId(u._id);
    setForm({ name: u.name, email: u.email, role: u.role, accountType: u.accountType, status: u.status, occupation: u.occupation, phone: u.phone });
    setShowPanel(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/users/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) {
          setUsers((prev) => prev.map((u) => u._id === editingId ? { ...u, ...form } : u));
          setShowPanel(false);
        }
      } else {
        const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) {
          router.refresh();
          setShowPanel(false);
        }
      }
    } catch {} finally { setSaving(false); }
  }, [form, editingId, router]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch {} finally { setDeleting(false); }
  }, [deleteTarget]);

  const handleQuickStatus = useCallback(async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, status } : u));
    } catch {}
  }, []);

  const columns: Column<UserRow>[] = useMemo(() => [
    {
      key: "name", label: "ผู้ใช้",
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.lineProfilePic
            ? <img src={r.lineProfilePic} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
            : <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${c("bg-white/10 text-white/50", "bg-gray-100 text-gray-500")}`}>{r.name.charAt(0)}</div>
          }
          <div>
            <p className="font-medium text-sm">{r.name}</p>
            {r.email && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "role", label: "สิทธิ์",
      render: (r) => <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${roleStyle[r.role] || roleStyle.user}`}>{ROLES.find((rl) => rl.value === r.role)?.label || r.role}</span>,
    },
    {
      key: "accountType", label: "โหมด",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.accountType === "business" ? "บริษัท" : "ส่วนตัว"}</span>,
    },
    {
      key: "lineUserId", label: "LINE",
      render: (r) => r.lineUserId
        ? <span className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center" title={r.lineDisplayName}><svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg></span>
        : <span className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>—</span>,
    },
    {
      key: "onboardingComplete", label: "Onboard",
      render: (r) => r.onboardingComplete
        ? <span className="text-green-400"><Check size={14} /></span>
        : <span className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>ยังไม่เสร็จ</span>,
    },
    {
      key: "loginCount", label: "เข้าใช้",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.loginCount} ครั้ง</span>,
    },
    {
      key: "createdAt", label: "วันสมัคร",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "-"}</span>,
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${statusStyle[r.status] || statusStyle.active}`}>{STATUSES.find((s) => s.value === r.status)?.label || r.status}</span>,
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r, dark) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => openEdit(r)} className={`p-1.5 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-blue-400" : "hover:bg-gray-100 text-gray-400 hover:text-blue-500"}`} title="แก้ไข"><Pencil size={14} /></button>
          {r.status === "active" && r._id !== currentUserId && (
            <button onClick={() => handleQuickStatus(r._id, "suspended")} className={`p-1.5 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-yellow-400" : "hover:bg-gray-100 text-gray-400 hover:text-yellow-500"}`} title="ระงับ"><Ban size={14} /></button>
          )}
          {r.status === "suspended" && (
            <button onClick={() => handleQuickStatus(r._id, "active")} className={`p-1.5 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-green-400" : "hover:bg-gray-100 text-gray-400 hover:text-green-500"}`} title="เปิดใช้งาน"><UserCheck size={14} /></button>
          )}
          {r._id !== currentUserId && (
            <button onClick={() => setDeleteTarget({ id: r._id, name: r.name })} className={`p-1.5 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`} title="ลบ"><Trash2 size={14} /></button>
          )}
        </div>
      ),
    },
  ], [currentUserId, isDark, handleQuickStatus]);

  const inp = `w-full h-9 px-3 ${c("bg-white/5 border-white/10 text-white", "bg-gray-50 border-gray-200 text-gray-900")} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`;
  const lbl = `block text-xs ${c("text-white/40", "text-gray-500")} mb-1`;
  const cardBg = c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200");
  const panelBg = c("bg-[#0a0a0a] border-white/10", "bg-white border-gray-200");
  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      {/* ── Edit/Add panel ── */}
      {showPanel && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowPanel(false)} />}
      {showPanel && (
        <div className={`fixed inset-y-0 right-0 z-50 w-[440px] max-w-[95vw] ${panelBg} border-l shadow-2xl overflow-y-auto animate-slide-in-right`}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>{editingId ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}</h2>
              <button onClick={() => setShowPanel(false)} className={`w-8 h-8 rounded-lg ${c("hover:bg-white/5 text-white/40", "hover:bg-gray-100 text-gray-400")} flex items-center justify-center text-xl`}>&times;</button>
            </div>

            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ข้อมูลผู้ใช้</p>
              <div><label className={lbl}>ชื่อ *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ชื่อ-นามสกุล" className={inp} /></div>
              <div><label className={lbl}>อีเมล</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>อาชีพ</label><input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="อาชีพ" className={inp} /></div>
                <div><label className={lbl}>โทรศัพท์</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08x-xxx-xxxx" className={inp} /></div>
              </div>
            </div>

            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">สิทธิ์ & การเข้าถึง</p>
              <div><label className={lbl}>สิทธิ์การใช้งาน</label><Select value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ROLES} /></div>
              <div><label className={lbl}>โหมด</label><Select value={form.accountType} onChange={(v) => setForm({ ...form, accountType: v })} options={ACCOUNT_TYPES} /></div>
              <div><label className={lbl}>สถานะ</label><Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} /></div>

              {/* Permission info */}
              <div className={`rounded-lg p-3 ${c("bg-white/[0.03]", "bg-gray-50")} space-y-1.5`}>
                <p className={`text-[11px] font-medium ${c("text-white/60", "text-gray-600")}`}>สิทธิ์ตามบทบาท:</p>
                <div className={`text-[10px] space-y-0.5 ${c("text-white/40", "text-gray-500")}`}>
                  <p><span className="font-medium text-red-400">Super Admin</span> — เข้าถึงทุกหน้า + จัดการผู้ใช้ + ลบข้อมูล</p>
                  <p><span className="font-medium text-purple-400">Admin</span> — เข้าถึงทุกหน้า + จัดการผู้ใช้</p>
                  <p><span className="font-medium text-blue-400">Manager</span> — อนุมัติรายจ่าย + ดูรายงาน + จัดการทีม</p>
                  <p><span className="font-medium text-teal-400">Accountant</span> — ดูรายงาน + จัดการเอกสาร + อนุมัติ</p>
                  <p><span className="font-medium text-gray-400">User</span> — เพิ่ม/แก้ไขข้อมูลตัวเอง</p>
                </div>
              </div>
            </div>

            <div className={`flex gap-2 pt-2 sticky bottom-0 pb-6 ${c("bg-[#0a0a0a]", "bg-white")}`}>
              <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{editingId ? "บันทึก" : "เพิ่มผู้ใช้"}
              </button>
              <button onClick={() => setShowPanel(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><AlertTriangle size={20} className="text-red-400" /></div>
                <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>ลบผู้ใช้</h2>
              </div>
              <p className={`text-sm ${c("text-white/60", "text-gray-600")}`}>คุณแน่ใจหรือไม่ว่าต้องการลบ <span className="font-bold">{deleteTarget.name}</span>?</p>
              <p className={`text-xs ${c("text-red-400/70", "text-red-500")}`}>ข้อมูลทั้งหมดจะถูกลบถาวร รวมถึงใบเสร็จ ไฟล์ พนักงาน และเงินเดือน</p>
              <div className="flex gap-2 pt-2">
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {deleting && <Loader2 size={14} className="animate-spin" />}ลบถาวร
                </button>
                <button onClick={() => setDeleteTarget(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <PageHeader title="จัดการผู้ใช้งาน" description="จัดการผู้ใช้ สิทธิ์การเข้าถึง และสถานะทั้งระบบ" />

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ผู้ใช้ทั้งหมด" value={`${stats.totalUsers} คน`} icon={<Users size={20} />} color="text-blue-500" />
        <StatsCard label="ใช้งานอยู่" value={`${stats.active} คน`} icon={<UserCheck size={20} />} color="text-green-500" />
        <StatsCard label="ใหม่เดือนนี้" value={`${stats.newMonth} คน`} icon={<UserPlus size={20} />} color="text-purple-500" />
        <StatsCard label="ใบเสร็จทั้งระบบ" value={stats.totalReceipts.toLocaleString()} icon={<Receipt size={20} />} color="text-orange-500" />
      </div>

      {/* ── Search + Filters + Actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหาชื่อ, อีเมล, LINE..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-32"><Select value={roleFilter} onChange={setRoleFilter} options={roleFilterOptions} /></div>
        <div className="w-32"><Select value={statusFilter} onChange={setStatusFilter} options={statusFilterOptions} /></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25">
          <UserPlus size={16} />เพิ่มผู้ใช้
        </button>
      </div>

      {/* ── Table ── */}
      <DataTable
        dateField="createdAt"
        columns={columns}
        data={filtered}
        rowKey={(r) => r._id}
        emptyText="ไม่พบผู้ใช้"
        columnConfigKey="admin-users"
      />
    </div>
  );
}
