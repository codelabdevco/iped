"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReactiveData } from "@/hooks/useReactiveMode";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Banknote, Users, CheckCircle, Clock, Plus, Play, Loader2,
  Pencil, Check, CreditCard, Trash2, Search, Filter,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
import Baht from "@/components/dashboard/Baht";

/* ── Thai month names ── */
const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

/* ── Bank options ── */
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

const empTypeLabel: Record<string, { label: string; cls: string }> = {
  "full-time": { label: "ประจำ", cls: "bg-blue-500/20 text-blue-400" },
  "part-time": { label: "พาร์ทไทม์", cls: "bg-purple-500/20 text-purple-400" },
  contract: { label: "สัญญาจ้าง", cls: "bg-yellow-500/20 text-yellow-400" },
  freelance: { label: "ฟรีแลนซ์", cls: "bg-orange-500/20 text-orange-400" },
};

const empStatusLabel: Record<string, { label: string; cls: string }> = {
  active: { label: "ทำงานอยู่", cls: "bg-green-500/20 text-green-400" },
  probation: { label: "ทดลองงาน", cls: "bg-yellow-500/20 text-yellow-400" },
  resigned: { label: "ลาออก", cls: "bg-gray-500/20 text-gray-400" },
  terminated: { label: "เลิกจ้าง", cls: "bg-red-500/20 text-red-400" },
};

const payrollStatusStyle: Record<string, { label: string; cls: string }> = {
  draft: { label: "แบบร่าง", cls: "bg-gray-500/20 text-gray-400" },
  pending: { label: "รออนุมัติ", cls: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "อนุมัติแล้ว", cls: "bg-blue-500/20 text-blue-400" },
  paid: { label: "จ่ายแล้ว", cls: "bg-green-500/20 text-green-400" },
  cancelled: { label: "ยกเลิก", cls: "bg-red-500/20 text-red-400" },
};

/* ── Interfaces ── */
interface Allowance { type: string; amount: number }
interface EmployeeRow {
  _id: string; employeeCode: string; name: string; nickname: string;
  position: string; department: string; employmentType: string;
  startDate: string; baseSalary: number; allowances: Allowance[];
  socialSecurity: boolean; providentFund: number;
  bankName: string; bankAccount: string; taxId: string;
  lineUserId: string; email: string; status: string;
}

interface PayrollRow {
  _id: string; employeeId: string; employeeCode: string; employeeName: string;
  department: string; position: string; baseSalary: number;
  overtime: { hours: number; ratePerHour: number; amount: number };
  allowances: Allowance[]; bonus: number; grossPay: number;
  socialSecurity: number; providentFund: number; tax: number;
  otherDeductions: Allowance[]; totalDeductions: number; netPay: number;
  status: string; month: number; year: number;
  bankName: string; bankAccount: string; note: string;
}

interface Stats { totalPayroll: number; totalEmployees: number; totalPaid: number; totalPending: number }

interface Props {
  employees: EmployeeRow[];
  payrolls: PayrollRow[];
  stats: Stats;
  currentMonth: number;
  currentYear: number;
}

/* ── Employee form state ── */
const defaultEmpForm = {
  employeeCode: "", name: "", nickname: "", position: "", department: "",
  employmentType: "full-time", startDate: new Date().toISOString().slice(0, 10),
  baseSalary: "", allowances: [] as { type: string; amount: string }[],
  socialSecurity: true, providentFund: "", bankName: "กสิกร",
  bankAccount: "", taxId: "", lineUserId: "", email: "",
};

export default function PayrollClient({ employees: initialEmp, payrolls: initialPay, stats: initialStats, currentMonth, currentYear }: Props) {
  const { isDark } = useTheme();
  const router = useRouter();
  const c = (d: string, l: string) => (isDark ? d : l);

  /* ── Reactive data ── */
  const [employees, setEmployees] = useReactiveData(initialEmp);
  const [payrolls, setPayrolls] = useReactiveData(initialPay);

  /* ── UI state ── */
  const initTab = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "employees" ? "employees" : "payroll";
  const [tab, setTab] = useState<"payroll" | "employees">(initTab as "payroll" | "employees");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ created: number; skipped: number } | null>(null);
  const [empForm, setEmpForm] = useState(defaultEmpForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ── Stats (recompute from local state) ── */
  const stats = useMemo(() => {
    const monthPayrolls = payrolls.filter((p) => p.month === selectedMonth && p.year === selectedYear);
    return {
      totalPayroll: monthPayrolls.reduce((s, p) => s + p.netPay, 0),
      totalEmployees: employees.length,
      totalPaid: monthPayrolls.filter((p) => p.status === "paid").length,
      totalPending: monthPayrolls.filter((p) => p.status === "draft" || p.status === "pending").length,
    };
  }, [payrolls, employees, selectedMonth, selectedYear]);

  /* ── Month/Year options ── */
  const monthOptions = TH_MONTHS.map((label, i) => ({ value: String(i + 1), label }));
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { value: String(y), label: String(y + 543) };
  });

  /* ── Status filter options ── */
  const payrollStatusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "draft", label: "แบบร่าง" },
    { value: "pending", label: "รออนุมัติ" },
    { value: "approved", label: "อนุมัติแล้ว" },
    { value: "paid", label: "จ่ายแล้ว" },
  ];

  const empStatusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "active", label: "ทำงานอยู่" },
    { value: "probation", label: "ทดลองงาน" },
    { value: "resigned", label: "ลาออก" },
  ];

  /* ── Payroll actions ── */
  const handlePayrollAction = useCallback(async (id: string, action: "approve" | "pay") => {
    const newStatus = action === "approve" ? "approved" : "paid";
    try {
      await fetch(`/api/payroll/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setPayrolls((prev) => prev.map((p) => p._id === id ? { ...p, status: newStatus } : p));
    } catch {}
  }, []);

  /* ── Run payroll ── */
  const handleRunPayroll = useCallback(async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      if (res.ok) {
        const json = await res.json();
        setRunResult({ created: json.created || 0, skipped: json.skipped || 0 });
        router.refresh();
      }
    } catch {} finally { setRunning(false); }
  }, [selectedMonth, selectedYear, router]);

  /* ── Employee form helpers ── */
  const openAddEmployee = () => {
    setEditingEmpId(null);
    const nextCode = `EMP${String(employees.length + 1).padStart(3, "0")}`;
    setEmpForm({ ...defaultEmpForm, employeeCode: nextCode });
    setShowAddEmployee(true);
  };

  const openEditEmployee = (emp: EmployeeRow) => {
    setEditingEmpId(emp._id);
    setEmpForm({
      employeeCode: emp.employeeCode,
      name: emp.name,
      nickname: emp.nickname,
      position: emp.position,
      department: emp.department,
      employmentType: emp.employmentType,
      startDate: emp.startDate ? emp.startDate.slice(0, 10) : "",
      baseSalary: String(emp.baseSalary),
      allowances: emp.allowances.map((a) => ({ type: a.type, amount: String(a.amount) })),
      socialSecurity: emp.socialSecurity,
      providentFund: String(emp.providentFund),
      bankName: emp.bankName || "กสิกร",
      bankAccount: emp.bankAccount,
      taxId: emp.taxId,
      lineUserId: emp.lineUserId || "",
      email: emp.email || "",
    });
    setShowAddEmployee(true);
  };

  const addAllowanceRow = () => setEmpForm((f) => ({ ...f, allowances: [...f.allowances, { type: "", amount: "" }] }));
  const removeAllowanceRow = (idx: number) => setEmpForm((f) => ({ ...f, allowances: f.allowances.filter((_, i) => i !== idx) }));
  const updateAllowance = (idx: number, key: "type" | "amount", val: string) => setEmpForm((f) => ({ ...f, allowances: f.allowances.map((a, i) => (i === idx ? { ...a, [key]: val } : a)) }));

  const handleSaveEmployee = async () => {
    if (!empForm.name || !empForm.baseSalary) return;
    setSaving(true);
    const body = {
      employeeCode: empForm.employeeCode, name: empForm.name, nickname: empForm.nickname,
      position: empForm.position, department: empForm.department, employmentType: empForm.employmentType,
      startDate: empForm.startDate, baseSalary: Number(empForm.baseSalary),
      allowances: empForm.allowances.filter((a) => a.type && a.amount).map((a) => ({ type: a.type, amount: Number(a.amount) })),
      socialSecurity: empForm.socialSecurity, providentFund: Number(empForm.providentFund) || 0,
      bankName: empForm.bankName, bankAccount: empForm.bankAccount, taxId: empForm.taxId,
      lineUserId: empForm.lineUserId || undefined, email: empForm.email || undefined,
    };
    try {
      if (editingEmpId) {
        const res = await fetch(`/api/employees/${editingEmpId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) setEmployees((prev) => prev.map((e) => e._id === editingEmpId ? { ...e, ...body, allowances: body.allowances, baseSalary: body.baseSalary } as EmployeeRow : e));
      } else {
        const res = await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) {
          const json = await res.json();
          setEmployees((prev) => [{ _id: json.employee?._id || `temp-${Date.now()}`, ...body, nickname: body.nickname || "", startDate: body.startDate, taxId: body.taxId || "", lineUserId: body.lineUserId || "", email: body.email || "", status: "active" } as EmployeeRow, ...prev]);
        }
      }
      setShowAddEmployee(false);
      setEditingEmpId(null);
    } catch {} finally { setSaving(false); }
  };

  /* ── Filtered data ── */
  const filteredPayrolls = useMemo(() => {
    let data = payrolls.filter((p) => p.month === selectedMonth && p.year === selectedYear);
    if (statusFilter !== "all") data = data.filter((p) => p.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((p) => p.employeeName.toLowerCase().includes(q) || p.employeeCode.toLowerCase().includes(q) || p.department.toLowerCase().includes(q));
    }
    return data;
  }, [payrolls, selectedMonth, selectedYear, statusFilter, search]);

  const filteredEmployees = useMemo(() => {
    let data = employees;
    if (statusFilter !== "all") data = data.filter((e) => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((e) => e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.position.toLowerCase().includes(q));
    }
    return data;
  }, [employees, statusFilter, search]);

  /* ── Payroll table columns ── */
  const payrollColumns: Column<PayrollRow>[] = useMemo(() => [
    { key: "employeeCode", label: "รหัส", render: (r) => <span className="font-mono text-xs">{r.employeeCode}</span> },
    {
      key: "employeeName", label: "ชื่อพนักงาน",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.employeeName}</p>
          {r.department && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.department}</p>}
        </div>
      ),
    },
    { key: "baseSalary", label: "เงินเดือน", align: "right", render: (r) => <Baht value={r.baseSalary} /> },
    { key: "overtime", label: "OT", align: "right", render: (r) => <Baht value={r.overtime?.amount || 0} />, defaultVisible: false },
    { key: "grossPay", label: "เงินได้รวม", align: "right", render: (r) => <Baht value={r.grossPay} /> },
    { key: "totalDeductions", label: "หักรวม", align: "right", render: (r) => <span className="text-red-400"><Baht value={r.totalDeductions} /></span> },
    {
      key: "netPay", label: "สุทธิ", align: "right",
      render: (r) => <span className="font-bold text-green-400"><Baht value={r.netPay} /></span>,
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => {
        const st = payrollStatusStyle[r.status] || payrollStatusStyle.draft;
        return <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span>;
      },
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r, dark) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {r.status === "draft" && (
            <button
              onClick={() => handlePayrollAction(r._id, "approve")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
            ><Check className="w-3 h-3 inline mr-1" />อนุมัติ</button>
          )}
          {r.status === "pending" && (
            <button
              onClick={() => handlePayrollAction(r._id, "approve")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
            ><Check className="w-3 h-3 inline mr-1" />อนุมัติ</button>
          )}
          {r.status === "approved" && (
            <button
              onClick={() => handlePayrollAction(r._id, "pay")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${dark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
            ><CreditCard className="w-3 h-3 inline mr-1" />จ่ายเงิน</button>
          )}
        </div>
      ),
    },
  ], [handlePayrollAction, isDark]);

  /* ── Employee table columns ── */
  const employeeColumns: Column<EmployeeRow>[] = useMemo(() => [
    { key: "employeeCode", label: "รหัส", render: (r) => <span className="font-mono text-xs">{r.employeeCode}</span> },
    {
      key: "name", label: "ชื่อ",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.name}{r.nickname ? ` (${r.nickname})` : ""}</p>
          {r.position && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.position}</p>}
        </div>
      ),
    },
    { key: "department", label: "แผนก" },
    { key: "baseSalary", label: "เงินเดือนฐาน", align: "right", render: (r) => <Baht value={r.baseSalary} /> },
    {
      key: "employmentType", label: "ประเภท",
      render: (r) => {
        const t = empTypeLabel[r.employmentType] || empTypeLabel["full-time"];
        return <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${t.cls}`}>{t.label}</span>;
      },
    },
    { key: "bankName", label: "ธนาคาร", render: (r) => <span className="text-xs">{r.bankName || "-"}</span> },
    {
      key: "lineUserId", label: "แจ้งเตือน",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          {r.lineUserId && <span className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center" title="LINE เชื่อมแล้ว"><svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg></span>}
          {r.email && <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center" title={r.email}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>}
          {!r.lineUserId && !r.email && <span className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>ยังไม่เชื่อม</span>}
        </div>
      ),
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => {
        const st = empStatusLabel[r.status] || empStatusLabel.active;
        return <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span>;
      },
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r, dark) => (
        <button
          onClick={(e) => { e.stopPropagation(); openEditEmployee(r); }}
          className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-blue-400" : "hover:bg-gray-100 text-gray-400 hover:text-blue-500"}`}
        ><Pencil size={14} /></button>
      ),
    },
  ], [isDark]);

  /* ── Style helpers ── */
  const inp = `w-full h-9 px-3 ${c("bg-white/5 border-white/10 text-white", "bg-gray-50 border-gray-200 text-gray-900")} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`;
  const lbl = `block text-xs ${c("text-white/40", "text-gray-500")} mb-1`;
  const cardBg = c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200");
  const panelBg = c("bg-[#0a0a0a] border-white/10", "bg-white border-gray-200");
  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      {/* ── Overlay + Slide panel ── */}
      {showAddEmployee && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => { setShowAddEmployee(false); setEditingEmpId(null); }} />}
      {showAddEmployee && (
        <div className={`fixed inset-y-0 right-0 z-50 w-[480px] max-w-[95vw] ${panelBg} border-l shadow-2xl overflow-y-auto animate-slide-in-right`}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>{editingEmpId ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}</h2>
              <button onClick={() => { setShowAddEmployee(false); setEditingEmpId(null); }} className={`w-8 h-8 rounded-lg ${c("hover:bg-white/5 text-white/40", "hover:bg-gray-100 text-gray-400")} flex items-center justify-center text-xl`}>&times;</button>
            </div>

            {/* ── Basic info ── */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ข้อมูลพนักงาน</p>
              <div><label className={lbl}>รหัสพนักงาน</label><input value={empForm.employeeCode} onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value })} className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ชื่อ-นามสกุล *</label><input value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} placeholder="ชื่อ นามสกุล" className={inp} /></div>
                <div><label className={lbl}>ชื่อเล่น</label><input value={empForm.nickname} onChange={(e) => setEmpForm({ ...empForm, nickname: e.target.value })} placeholder="ชื่อเล่น" className={inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ตำแหน่ง</label><input value={empForm.position} onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })} placeholder="ตำแหน่ง" className={inp} /></div>
                <div><label className={lbl}>แผนก</label><input value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} placeholder="แผนก" className={inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ประเภทการจ้าง</label><Select value={empForm.employmentType} onChange={(v) => setEmpForm({ ...empForm, employmentType: v })} options={EMPLOYMENT_TYPES} /></div>
                <div><label className={lbl}>วันที่เริ่มงาน</label><DatePicker value={empForm.startDate} onChange={(v) => setEmpForm({ ...empForm, startDate: v })} /></div>
              </div>
            </div>

            {/* ── Compensation ── */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ค่าตอบแทน</p>
              <div><label className={lbl}>เงินเดือนฐาน (บาท) *</label><input type="number" value={empForm.baseSalary} onChange={(e) => setEmpForm({ ...empForm, baseSalary: e.target.value })} placeholder="0" className={inp} /></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={lbl}>เงินเพิ่ม / ค่าเบี้ยเลี้ยง</label>
                  <button onClick={addAllowanceRow} className="text-xs text-[#FA3633] hover:text-[#e0302d] flex items-center gap-1"><Plus size={12} />เพิ่ม</button>
                </div>
                {empForm.allowances.map((a, i) => (
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
                <input type="checkbox" checked={empForm.socialSecurity} onChange={(e) => setEmpForm({ ...empForm, socialSecurity: e.target.checked })} className="rounded border-white/20 bg-white/5 text-[#FA3633] focus:ring-[#FA3633]/30" />
                <span className={`text-sm ${c("text-white", "text-gray-900")}`}>ประกันสังคม</span>
              </label>
              <div><label className={lbl}>กองทุนสำรองเลี้ยงชีพ (%)</label><input type="number" value={empForm.providentFund} onChange={(e) => setEmpForm({ ...empForm, providentFund: e.target.value })} placeholder="0" className={inp} /></div>
            </div>

            {/* ── Banking ── */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ข้อมูลธนาคาร</p>
              <div><label className={lbl}>ธนาคาร</label><Select value={empForm.bankName} onChange={(v) => setEmpForm({ ...empForm, bankName: v })} options={BANK_OPTIONS} /></div>
              <div><label className={lbl}>เลขบัญชี</label><input value={empForm.bankAccount} onChange={(e) => setEmpForm({ ...empForm, bankAccount: e.target.value })} placeholder="เลขบัญชีธนาคาร" className={inp} /></div>
              <div><label className={lbl}>เลขประจำตัวผู้เสียภาษี</label><input value={empForm.taxId} onChange={(e) => setEmpForm({ ...empForm, taxId: e.target.value })} placeholder="เลข 13 หลัก" className={inp} /></div>
            </div>

            {/* ── Notifications ── */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">แจ้งเตือนเงินเดือน</p>
              <div><label className={lbl}>LINE User ID</label><input value={empForm.lineUserId} onChange={(e) => setEmpForm({ ...empForm, lineUserId: e.target.value })} placeholder="Uxxxxxxxxx (จาก LINE Bot)" className={inp} /></div>
              <div><label className={lbl}>Email</label><input type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} placeholder="employee@email.com" className={inp} /></div>
              <p className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>เมื่ออนุมัติหรือจ่ายเงินเดือน ระบบจะส่งสลิปเงินเดือนผ่าน LINE และ/หรือ Email อัตโนมัติ</p>
            </div>

            {/* ── Save buttons ── */}
            <div className={`flex gap-2 pt-2 sticky bottom-0 pb-6 ${c("bg-[#0a0a0a]", "bg-white")}`}>
              <button onClick={handleSaveEmployee} disabled={saving || !empForm.name || !empForm.baseSalary} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{editingEmpId ? "บันทึก" : "เพิ่มพนักงาน"}
              </button>
              <button onClick={() => { setShowAddEmployee(false); setEditingEmpId(null); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60 hover:bg-white/10", "bg-gray-100 text-gray-600 hover:bg-gray-200")} transition-colors`}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Run payroll modal ── */}
      {showRunModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => { setShowRunModal(false); setRunResult(null); }} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>สร้างเงินเดือน</h2>
              {!runResult ? (
                <>
                  <p className={`text-sm ${c("text-white/60", "text-gray-600")}`}>สร้างเงินเดือนเดือน {TH_MONTHS[selectedMonth - 1]}/{selectedYear + 543} สำหรับพนักงาน {employees.length} คน?</p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleRunPayroll} disabled={running} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                      {running && <Loader2 size={14} className="animate-spin" />}{running ? "กำลังสร้าง..." : "ยืนยัน"}
                    </button>
                    <button onClick={() => setShowRunModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`rounded-xl ${cardBg} border p-4 space-y-2`}>
                    <p className={`text-sm ${c("text-white", "text-gray-900")}`}>สร้างสำเร็จ: <span className="font-bold text-green-400">{runResult.created}</span> รายการ</p>
                    <p className={`text-sm ${c("text-white/60", "text-gray-600")}`}>ข้ามไป (มีแล้ว): <span className="font-medium">{runResult.skipped}</span> รายการ</p>
                  </div>
                  <button onClick={() => { setShowRunModal(false); setRunResult(null); router.refresh(); }} className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors">ปิด</button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <PageHeader title="จ่ายเงินเดือน" description="จัดการเงินเดือน OT ค่าล่วงเวลา และสวัสดิการพนักงาน" />

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ยอดจ่ายเดือนนี้" value={`฿${stats.totalPayroll.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Banknote size={20} />} color="text-[#FA3633]" />
        <StatsCard label="พนักงานทั้งหมด" value={`${stats.totalEmployees} คน`} icon={<Users size={20} />} color="text-blue-500" />
        <StatsCard label="จ่ายแล้ว" value={`${stats.totalPaid} คน`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="รอดำเนินการ" value={`${stats.totalPending} คน`} icon={<Clock size={20} />} color="text-yellow-500" />
      </div>

      {/* ── Action bar + Search + Filter (same pattern as receipts page) ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month/Year selector (payroll tab only) */}
        {tab === "payroll" && (
          <div className="flex gap-2">
            <div className="w-40"><Select value={String(selectedMonth)} onChange={(v) => setSelectedMonth(Number(v))} options={monthOptions} /></div>
            <div className="w-28"><Select value={String(selectedYear)} onChange={(v) => setSelectedYear(Number(v))} options={yearOptions} /></div>
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input
            type="text"
            placeholder={tab === "payroll" ? "ค้นหาชื่อ, รหัส, แผนก..." : "ค้นหาพนักงาน..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`}
          />
        </div>

        {/* Status filter */}
        <div className="w-36">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={tab === "payroll" ? payrollStatusOptions : empStatusOptions}
          />
        </div>

        {/* Action buttons */}
        <button onClick={() => setShowRunModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25">
          <Play size={16} />สร้างเงินเดือน
        </button>
        <Link href="/dashboard/team" className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${c("bg-white/5 text-white/70 hover:bg-white/10 border border-white/10", "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200")}`}>
          <Users size={16} />จัดการพนักงาน
        </Link>
      </div>

      {/* ── Table ── */}
      <DataTable columns={payrollColumns} data={filteredPayrolls} rowKey={(r) => r._id} emptyText="ยังไม่มีข้อมูลเงินเดือนเดือนนี้ — กด 'สร้างเงินเดือน' เพื่อเริ่มต้น" columnConfigKey="payroll-slips" />
    </div>
  );
}
