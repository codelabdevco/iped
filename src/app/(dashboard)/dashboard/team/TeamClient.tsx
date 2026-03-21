"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useReactiveData } from "@/hooks/useReactiveMode";
import { useTheme } from "@/contexts/ThemeContext";
import { useMode } from "@/contexts/ModeContext";
import {
  Users, UserCheck, UserPlus, Clock, Search, Pencil,
  Banknote, Shield, Loader2, Trash2, X, Link2, Copy, Share2, Building2, AlertTriangle,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
import Baht from "@/components/dashboard/Baht";
import { Plus } from "lucide-react";

const BANK_OPTIONS = [
  { value: "กสิกร", label: "กสิกร (KBank)" },
  { value: "กรุงเทพ", label: "กรุงเทพ (BBL)" },
  { value: "ไทยพาณิชย์", label: "ไทยพาณิชย์ (SCB)" },
  { value: "กรุงไทย", label: "กรุงไทย (KTB)" },
  { value: "ทหารไทยธนชาต", label: "ทหารไทยธนชาต (TTB)" },
  { value: "ออมสิน", label: "ออมสิน (GSB)" },
  { value: "อื่นๆ", label: "อื่นๆ" },
];

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "พนักงานประจำ" },
  { value: "part-time", label: "พาร์ทไทม์" },
  { value: "contract", label: "สัญญาจ้าง" },
  { value: "freelance", label: "ฟรีแลนซ์" },
];

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

interface OrgDept { _id: string; name: string; description: string }
interface OrgPos { _id: string; name: string; level: number }

interface Props {
  members: TeamMember[];
  departments: DeptInfo[];
  stats: { total: number; active: number; probation: number };
  inviteCode?: string;
  orgName?: string;
  orgDepartments?: OrgDept[];
  orgPositions?: OrgPos[];
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

export default function TeamClient({ members: initialMembers, departments, stats: initialStats, inviteCode, orgName, orgDepartments: initDepts = [], orgPositions: initPos = [] }: Props) {
  const { isDark } = useTheme();
  const { mode } = useMode();
  const modeHref = (path: string) => `/${mode}${path}`;
  const c = (d: string, l: string) => (isDark ? d : l);
  const [members, setMembers] = useReactiveData(initialMembers);
  const [tab, setTab] = useState<"team" | "structure" | "permissions">("team");

  // ── Department & Position management ──
  const [orgDepts, setOrgDepts] = useState(initDepts);
  const [orgPos, setOrgPos] = useState(initPos);
  const [newDept, setNewDept] = useState("");
  const [newPos, setNewPos] = useState("");
  const [editDept, setEditDept] = useState<{ id: string; name: string } | null>(null);
  const [editPos, setEditPos] = useState<{ id: string; name: string } | null>(null);
  const [structSaving, setStructSaving] = useState(false);

  const handleAddDept = async () => {
    if (!newDept.trim()) return;
    setStructSaving(true);
    const res = await fetch("/api/org/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "department", name: newDept.trim() }) });
    if (res.ok) { setNewDept(""); const d = await fetch("/api/org/departments").then(r => r.json()); setOrgDepts(d.departments); setOrgPos(d.positions); }
    setStructSaving(false);
  };
  const handleAddPos = async () => {
    if (!newPos.trim()) return;
    setStructSaving(true);
    const res = await fetch("/api/org/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "position", name: newPos.trim() }) });
    if (res.ok) { setNewPos(""); const d = await fetch("/api/org/departments").then(r => r.json()); setOrgDepts(d.departments); setOrgPos(d.positions); }
    setStructSaving(false);
  };
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "department" | "position"; id: string; name: string; count: number } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const confirmDeleteDept = (d: OrgDept) => {
    const count = members.filter(m => m.department === d.name).length;
    setDeleteConfirm({ type: "department", id: d._id, name: d.name, count });
  };
  const confirmDeletePos = (p: OrgPos) => {
    const count = members.filter(m => m.position === p.name).length;
    setDeleteConfirm({ type: "position", id: p._id, name: p.name, count });
  };
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    const res = await fetch("/api/org/departments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: deleteConfirm.type, id: deleteConfirm.id }) });
    if (res.ok) {
      if (deleteConfirm.type === "department") setOrgDepts(prev => prev.filter(d => d._id !== deleteConfirm.id));
      else setOrgPos(prev => prev.filter(p => p._id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
    setDeleteLoading(false);
  };
  const handleUpdateDept = async () => {
    if (!editDept) return;
    await fetch("/api/org/departments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "department", id: editDept.id, name: editDept.name }) });
    setOrgDepts(prev => prev.map(d => d._id === editDept.id ? { ...d, name: editDept.name } : d));
    setEditDept(null);
  };
  const handleUpdatePos = async () => {
    if (!editPos) return;
    await fetch("/api/org/departments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "position", id: editPos.id, name: editPos.name }) });
    setOrgPos(prev => prev.map(p => p._id === editPos.id ? { ...p, name: editPos.name } : p));
    setEditPos(null);
  };

  // Department + position dropdown options for employee form
  const deptSelectOptions = orgDepts.length > 0
    ? orgDepts.map(d => ({ value: d.name, label: d.name }))
    : [{ value: "", label: "กรุณาเพิ่มแผนกก่อน" }];
  const posSelectOptions = orgPos.length > 0
    ? orgPos.map(p => ({ value: p.name, label: p.name }))
    : [{ value: "", label: "กรุณาเพิ่มตำแหน่งก่อน" }];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // ── Add/Edit Employee Panel ──
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const defaultForm = {
    employeeCode: "", name: "", nickname: "", position: "", department: "",
    employmentType: "full-time", startDate: new Date().toISOString().slice(0, 10),
    baseSalary: "", allowances: [] as { type: string; amount: string }[],
    socialSecurity: true, providentFund: "",
    bankName: "กสิกร", bankAccount: "", taxId: "",
    lineUserId: "", email: "",
  };
  const [form, setForm] = useState(defaultForm);

  const addAllowanceRow = () => setForm((f) => ({ ...f, allowances: [...f.allowances, { type: "", amount: "" }] }));
  const removeAllowanceRow = (idx: number) => setForm((f) => ({ ...f, allowances: f.allowances.filter((_, i) => i !== idx) }));
  const updateAllowance = (idx: number, key: "type" | "amount", val: string) => setForm((f) => ({ ...f, allowances: f.allowances.map((a, i) => (i === idx ? { ...a, [key]: val } : a)) }));

  const [copied, setCopied] = useState<"code" | "link" | "line" | null>(null);
  const inviteLink = inviteCode ? `https://iped.codelabdev.co/join/${inviteCode}` : "";
  const lineCommand = inviteCode ? `เชื่อม ${inviteCode}` : "";
  const copyText = (text: string, type: "code" | "link" | "line") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const openAdd = () => { setEditingId(null); setForm(defaultForm); setShowPanel(true); };
  const openEdit = (m: TeamMember) => {
    setEditingId(m._id);
    setForm({
      employeeCode: m.employeeCode, name: m.name, nickname: m.nickname,
      position: m.position === "-" ? "" : m.position, department: m.department === "-" ? "" : m.department,
      employmentType: m.employmentType, startDate: m.startDate ? m.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      baseSalary: String(m.baseSalary), allowances: [],
      socialSecurity: true, providentFund: "",
      bankName: m.bankName || "กสิกร", bankAccount: "", taxId: "",
      lineUserId: m.lineUserId || "", email: m.email || "",
    });
    setShowPanel(true);
  };
  const handleSave = async () => {
    if (!form.name || !form.baseSalary) return;
    setSaving(true);
    try {
      const body = {
        employeeCode: form.employeeCode, name: form.name, nickname: form.nickname,
        position: form.position, department: form.department, employmentType: form.employmentType,
        startDate: form.startDate, baseSalary: Number(form.baseSalary),
        allowances: form.allowances.filter((a) => a.type && a.amount).map((a) => ({ type: a.type, amount: Number(a.amount) })),
        socialSecurity: form.socialSecurity, providentFund: Number(form.providentFund) || 0,
        bankName: form.bankName, bankAccount: form.bankAccount, taxId: form.taxId,
        lineUserId: form.lineUserId || undefined, email: form.email || undefined,
      };
      if (editingId) {
        const res = await fetch(`/api/employees/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) {
          setMembers(prev => prev.map(m => m._id === editingId ? { ...m, ...body, baseSalary: body.baseSalary } as TeamMember : m));
          setShowPanel(false);
        }
      } else {
        const res = await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) {
          const json = await res.json();
          const emp = json.data?.employee;
          setMembers(prev => [{ _id: emp?._id || `temp-${Date.now()}`, ...body, nickname: body.nickname || "", startDate: body.startDate, lineUserId: body.lineUserId || "", email: body.email || "", status: "active" } as TeamMember, ...prev]);
          setShowPanel(false);
        }
      }
    } catch {} finally { setSaving(false); }
  };

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
        <button
          onClick={() => openEdit(r)}
          className={`p-2 rounded-lg transition-colors inline-flex ${c("hover:bg-white/5 text-white/40 hover:text-blue-400", "hover:bg-gray-100 text-gray-400 hover:text-blue-500")}`}
        ><Pencil size={14} /></button>
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

  const inp = `w-full h-9 px-3 ${c("bg-white/5 border-white/10 text-white", "bg-gray-50 border-gray-200 text-gray-900")} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`;
  const lbl = `block text-xs ${c("text-white/40", "text-gray-500")} mb-1`;
  const panelBg = c("bg-[#0a0a0a] border-white/10", "bg-white border-gray-200");
  const cardBg = c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200");

  const empTypeOptions = [
    { value: "full-time", label: "เต็มเวลา" },
    { value: "part-time", label: "พาร์ทไทม์" },
    { value: "contract", label: "สัญญาจ้าง" },
    { value: "freelance", label: "ฟรีแลนซ์" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Add/Edit Employee Panel ── */}
      {showPanel && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowPanel(false)} />}
      {showPanel && (
        <div className={`fixed inset-y-0 right-0 z-50 w-[480px] max-w-[95vw] ${panelBg} border-l shadow-2xl overflow-y-auto animate-slide-in-right`}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>{editingId ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}</h2>
              <button onClick={() => setShowPanel(false)} className={`w-8 h-8 rounded-lg ${c("hover:bg-white/5 text-white/40", "hover:bg-gray-100 text-gray-400")} flex items-center justify-center`}><X size={18} /></button>
            </div>

            {/* ── Basic info ── */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ข้อมูลพนักงาน</p>
              <div><label className={lbl}>รหัสพนักงาน</label><input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="EMP001" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ชื่อ-นามสกุล *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ชื่อ นามสกุล" className={inp} /></div>
                <div><label className={lbl}>ชื่อเล่น</label><input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="ชื่อเล่น" className={inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ตำแหน่ง</label>{orgPos.length > 0 ? <Select value={form.position} onChange={(v) => setForm({ ...form, position: v })} options={posSelectOptions} /> : <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="ตำแหน่ง" className={inp} />}</div>
                <div><label className={lbl}>แผนก</label>{orgDepts.length > 0 ? <Select value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={deptSelectOptions} /> : <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="แผนก" className={inp} />}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ประเภทการจ้าง</label><Select value={form.employmentType} onChange={(v) => setForm({ ...form, employmentType: v })} options={EMPLOYMENT_TYPES} /></div>
                <div><label className={lbl}>วันที่เริ่มงาน</label><DatePicker value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} /></div>
              </div>
            </div>

            {/* ── Compensation ── */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ค่าตอบแทน</p>
              <div><label className={lbl}>เงินเดือนฐาน (บาท) *</label><input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} placeholder="0" className={inp} /></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={lbl}>เงินเพิ่ม / ค่าเบี้ยเลี้ยง</label>
                  <button onClick={addAllowanceRow} className="text-xs text-[#FA3633] hover:text-[#e0302d] flex items-center gap-1"><Plus size={12} />เพิ่ม</button>
                </div>
                {form.allowances.map((a, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={a.type} onChange={(e) => updateAllowance(i, "type", e.target.value)} placeholder="ประเภท เช่น ค่าเดินทาง" className={`${inp} flex-1`} />
                    <input type="number" value={a.amount} onChange={(e) => updateAllowance(i, "amount", e.target.value)} placeholder="จำนวน" className={`${inp} w-28`} />
                    <button onClick={() => removeAllowanceRow(i)} className={`p-2 rounded-lg ${c("hover:bg-white/5 text-white/40 hover:text-red-400", "hover:bg-gray-100 text-gray-400 hover:text-red-500")}`}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Deductions ── */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">หักเงิน</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.socialSecurity} onChange={(e) => setForm({ ...form, socialSecurity: e.target.checked })} className="rounded border-white/20 bg-white/5 text-[#FA3633] focus:ring-[#FA3633]/30" />
                <span className={`text-sm ${c("text-white", "text-gray-900")}`}>ประกันสังคม</span>
              </label>
              <div><label className={lbl}>กองทุนสำรองเลี้ยงชีพ (%)</label><input type="number" value={form.providentFund} onChange={(e) => setForm({ ...form, providentFund: e.target.value })} placeholder="0" className={inp} /></div>
            </div>

            {/* ── Banking ── */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ข้อมูลธนาคาร</p>
              <div><label className={lbl}>ธนาคาร</label><Select value={form.bankName} onChange={(v) => setForm({ ...form, bankName: v })} options={BANK_OPTIONS} /></div>
              <div><label className={lbl}>เลขบัญชี</label><input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} placeholder="เลขบัญชีธนาคาร" className={inp} /></div>
              <div><label className={lbl}>เลขประจำตัวผู้เสียภาษี</label><input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="เลข 13 หลัก" className={inp} /></div>
            </div>

            {/* ── Notifications ── */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">แจ้งเตือนเงินเดือน</p>
              <div><label className={lbl}>LINE User ID</label><input value={form.lineUserId} onChange={(e) => setForm({ ...form, lineUserId: e.target.value })} placeholder="Uxxxxxxxxx (จาก LINE Bot)" className={inp} /></div>
              <div><label className={lbl}>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="employee@email.com" className={inp} /></div>
              <p className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>เมื่ออนุมัติหรือจ่ายเงินเดือน ระบบจะส่งสลิปเงินเดือนผ่าน LINE และ/หรือ Email อัตโนมัติ</p>
            </div>

            {/* ── Save ── */}
            <div className={`flex gap-2 pt-2 sticky bottom-0 pb-6 ${c("bg-[#0a0a0a]", "bg-white")}`}>
              <button onClick={handleSave} disabled={saving || !form.name || !form.baseSalary} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{editingId ? "บันทึก" : "เพิ่มพนักงาน"}
              </button>
              <button onClick={() => setShowPanel(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60 hover:bg-white/10", "bg-gray-100 text-gray-600 hover:bg-gray-200")} transition-colors`}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[420px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><AlertTriangle size={20} className="text-red-400" /></div>
                <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>
                  ลบ{deleteConfirm.type === "department" ? "แผนก" : "ตำแหน่ง"}
                </h2>
              </div>
              <p className={`text-sm ${c("text-white/60", "text-gray-600")}`}>
                คุณแน่ใจหรือไม่ว่าต้องการลบ{deleteConfirm.type === "department" ? "แผนก" : "ตำแหน่ง"} <span className="font-bold">&ldquo;{deleteConfirm.name}&rdquo;</span>?
              </p>
              {deleteConfirm.count > 0 && (
                <div className={`flex items-center gap-2 p-3 rounded-xl ${c("bg-yellow-500/10 border border-yellow-500/20", "bg-yellow-50 border border-yellow-200")}`}>
                  <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
                  <p className={`text-xs ${c("text-yellow-300", "text-yellow-700")}`}>
                    มีพนักงาน <span className="font-bold">{deleteConfirm.count} คน</span> อยู่ใน{deleteConfirm.type === "department" ? "แผนก" : "ตำแหน่ง"}นี้ — ข้อมูลพนักงานจะไม่ถูกลบ แต่{deleteConfirm.type === "department" ? "แผนก" : "ตำแหน่ง"}จะหายจากตัวเลือก
                  </p>
                </div>
              )}
              {deleteConfirm.count === 0 && (
                <p className={`text-xs ${c("text-white/40", "text-gray-500")}`}>
                  ไม่มีพนักงานใน{deleteConfirm.type === "department" ? "แผนก" : "ตำแหน่ง"}นี้ — สามารถลบได้อย่างปลอดภัย
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={handleConfirmDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {deleteLoading && <Loader2 size={14} className="animate-spin" />}ลบ{deleteConfirm.type === "department" ? "แผนก" : "ตำแหน่ง"}
                </button>
                <button onClick={() => setDeleteConfirm(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      <PageHeader title="พนักงาน & แผนก" description="จัดการทีมงาน สิทธิ์การใช้งาน และแผนกในองค์กร" />

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="พนักงานทั้งหมด" value={`${stats.total} คน`} icon={<Users size={20} />} color="text-blue-500" />
        <StatsCard label="ทำงานอยู่" value={`${stats.active} คน`} icon={<UserCheck size={20} />} color="text-green-500" />
        <StatsCard label="ทดลองงาน" value={`${stats.probation} คน`} icon={<Clock size={20} />} color="text-yellow-500" />
        <StatsCard label="แผนก" value={`${departments.length} แผนก`} icon={<Users size={20} />} color="text-purple-500" />
      </div>

      {/* ── Invite Section ── */}
      {inviteCode && (
        <div className={`rounded-2xl border p-5 ${c("bg-blue-500/[0.04] border-blue-500/10", "bg-blue-50 border-blue-200")}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c("bg-blue-500/15", "bg-blue-100")}`}>
                <Share2 size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${c("text-white", "text-gray-900")}`}>เชิญพนักงานเข้า{orgName ? ` "${orgName}"` : "บริษัท"}</h3>
                <p className={`text-xs ${c("text-white/40", "text-gray-500")}`}>แชร์ลิงก์หรือรหัสเชิญให้พนักงาน — เชื่อมผ่าน LINE Bot หรือเปิดลิงก์</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => copyText(inviteCode, "code")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  copied === "code"
                    ? "bg-green-500/20 text-green-400"
                    : c("bg-white/[0.06] text-white/60 hover:bg-white/[0.1]", "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200")
                }`}
              >
                {copied === "code" ? <UserCheck size={13} /> : <Copy size={13} />}
                {copied === "code" ? "คัดลอกแล้ว!" : `รหัส: ${inviteCode}`}
              </button>
              <button
                onClick={() => copyText(inviteLink, "link")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  copied === "link"
                    ? "bg-green-500/20 text-green-400"
                    : c("bg-white/[0.06] text-white/60 hover:bg-white/[0.1]", "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200")
                }`}
              >
                {copied === "link" ? <UserCheck size={13} /> : <Link2 size={13} />}
                {copied === "link" ? "คัดลอกแล้ว!" : "คัดลอกลิงก์เชิญ"}
              </button>
              <button
                onClick={() => copyText(lineCommand, "line")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  copied === "line"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-[#06C755]/20 text-[#06C755] hover:bg-[#06C755]/30"
                }`}
              >
                {copied === "line" ? <UserCheck size={13} /> : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>}
                {copied === "line" ? "คัดลอกแล้ว!" : "คัดลอกคำสั่ง LINE"}
              </button>
            </div>
          </div>
          <div className={`mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] ${c("text-white/30", "text-gray-400")}`}>
            <span>วิธี 1: เปิดลิงก์เชิญในเบราว์เซอร์</span>
            <span>วิธี 2: พิมพ์ "{lineCommand}" ใน LINE @315ilalq</span>
            <span>วิธี 3: กรอกรหัสในแอปมือถือ &gt; โปรไฟล์</span>
          </div>
        </div>
      )}

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
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25"
        >
          <UserPlus size={16} />เพิ่มพนักงาน
        </button>
        <Link
          href={modeHref("/dashboard/payroll")}
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
          onClick={() => setTab("structure")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "structure" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50 hover:text-white/70", "text-gray-500 hover:text-gray-700")}`}
        >
          <Building2 size={14} className="inline mr-1.5 -mt-0.5" />แผนก & ตำแหน่ง
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
      {tab === "structure" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Departments ── */}
          <div className={`rounded-2xl border p-5 ${c("bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold ${c("text-white", "text-gray-900")}`}><Building2 size={15} className="inline mr-1.5 -mt-0.5 text-blue-400" />แผนก ({orgDepts.length})</h3>
            </div>
            <div className="flex gap-2 mb-4">
              <input value={newDept} onChange={(e) => setNewDept(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddDept()} placeholder="ชื่อแผนกใหม่..." className={`${inp} flex-1`} />
              <button onClick={handleAddDept} disabled={!newDept.trim() || structSaving} className="px-3 py-2 rounded-lg bg-[#FA3633] text-white text-xs font-medium hover:bg-[#e0302d] disabled:opacity-40 shrink-0">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {orgDepts.map((d) => (
                <div key={d._id} className={`flex items-center gap-2 p-3 rounded-xl border ${c("border-white/[0.06] bg-white/[0.02]", "border-gray-100 bg-gray-50")}`}>
                  {editDept?.id === d._id ? (
                    <>
                      <input value={editDept.name} onChange={(e) => setEditDept({ ...editDept, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleUpdateDept()} className={`${inp} flex-1`} autoFocus />
                      <button onClick={handleUpdateDept} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg"><UserCheck size={14} /></button>
                      <button onClick={() => setEditDept(null)} className={`p-1.5 rounded-lg ${c("text-white/30 hover:bg-white/5", "text-gray-400 hover:bg-gray-100")}`}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <Building2 size={14} className="text-blue-400 shrink-0" />
                      <span className={`text-sm flex-1 ${c("text-white/80", "text-gray-700")}`}>{d.name}</span>
                      <span className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>{members.filter(m => m.department === d.name).length} คน</span>
                      <button onClick={() => setEditDept({ id: d._id, name: d.name })} className={`p-1.5 rounded-lg ${c("text-white/30 hover:text-blue-400 hover:bg-white/5", "text-gray-400 hover:text-blue-500 hover:bg-gray-100")}`}><Pencil size={12} /></button>
                      <button onClick={() => confirmDeleteDept(d)} className={`p-1.5 rounded-lg ${c("text-white/30 hover:text-red-400 hover:bg-white/5", "text-gray-400 hover:text-red-500 hover:bg-gray-100")}`}><Trash2 size={12} /></button>
                    </>
                  )}
                </div>
              ))}
              {orgDepts.length === 0 && <p className={`text-center text-xs py-6 ${c("text-white/30", "text-gray-400")}`}>ยังไม่มีแผนก — เพิ่มแผนกแรกด้านบน</p>}
            </div>
          </div>

          {/* ── Positions ── */}
          <div className={`rounded-2xl border p-5 ${c("bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold ${c("text-white", "text-gray-900")}`}><Shield size={15} className="inline mr-1.5 -mt-0.5 text-purple-400" />ตำแหน่ง ({orgPos.length})</h3>
            </div>
            <div className="flex gap-2 mb-4">
              <input value={newPos} onChange={(e) => setNewPos(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddPos()} placeholder="ชื่อตำแหน่งใหม่..." className={`${inp} flex-1`} />
              <button onClick={handleAddPos} disabled={!newPos.trim() || structSaving} className="px-3 py-2 rounded-lg bg-[#FA3633] text-white text-xs font-medium hover:bg-[#e0302d] disabled:opacity-40 shrink-0">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {orgPos.map((p) => (
                <div key={p._id} className={`flex items-center gap-2 p-3 rounded-xl border ${c("border-white/[0.06] bg-white/[0.02]", "border-gray-100 bg-gray-50")}`}>
                  {editPos?.id === p._id ? (
                    <>
                      <input value={editPos.name} onChange={(e) => setEditPos({ ...editPos, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleUpdatePos()} className={`${inp} flex-1`} autoFocus />
                      <button onClick={handleUpdatePos} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg"><UserCheck size={14} /></button>
                      <button onClick={() => setEditPos(null)} className={`p-1.5 rounded-lg ${c("text-white/30 hover:bg-white/5", "text-gray-400 hover:bg-gray-100")}`}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <Shield size={14} className="text-purple-400 shrink-0" />
                      <span className={`text-sm flex-1 ${c("text-white/80", "text-gray-700")}`}>{p.name}</span>
                      <span className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>{members.filter(m => m.position === p.name).length} คน</span>
                      <button onClick={() => setEditPos({ id: p._id, name: p.name })} className={`p-1.5 rounded-lg ${c("text-white/30 hover:text-blue-400 hover:bg-white/5", "text-gray-400 hover:text-blue-500 hover:bg-gray-100")}`}><Pencil size={12} /></button>
                      <button onClick={() => confirmDeletePos(p)} className={`p-1.5 rounded-lg ${c("text-white/30 hover:text-red-400 hover:bg-white/5", "text-gray-400 hover:text-red-500 hover:bg-gray-100")}`}><Trash2 size={12} /></button>
                    </>
                  )}
                </div>
              ))}
              {orgPos.length === 0 && <p className={`text-center text-xs py-6 ${c("text-white/30", "text-gray-400")}`}>ยังไม่มีตำแหน่ง — เพิ่มตำแหน่งแรกด้านบน</p>}
            </div>
          </div>
        </div>
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
