"use client";

import { useState, useMemo, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Landmark, CircleDollarSign, CheckCircle, AlertTriangle, Clock, Plus,
  Search, Pencil, Trash2, X, Loader2, Banknote, CreditCard, History,
  Building2, User, FileText, ChevronDown, ChevronUp, Paperclip, Upload,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
import Baht from "@/components/dashboard/Baht";

interface DebtFile {
  _id: string; name: string; type: string; size: number; uploadedAt: string;
}

interface Payment {
  _id: string; date: string; amount: number; principal: number; interest: number;
  paymentType: string; note: string; files: DebtFile[];
}

interface DebtRow {
  _id: string; creditor: string; creditorType: string; debtType: string;
  originalAmount: number; remainingBalance: number; interestRate: number; interestType: string;
  monthlyPayment: number; startDate: string; dueDate: string;
  contractNumber: string; collateral: string; guarantor: string; bankAccount: string;
  totalPaid: number; totalInterestPaid: number; paymentsCount: number; filesCount: number;
  payments: Payment[]; status: string; note: string; createdAt: string;
}

interface Props {
  debts: DebtRow[];
  stats: { totalDebt: number; totalRemaining: number; totalPaid: number; active: number; paid: number; overdue: number };
}

const CREDITOR_TYPES = [
  { value: "bank", label: "ธนาคาร" }, { value: "company", label: "บริษัท/นิติบุคคล" },
  { value: "personal", label: "บุคคล" }, { value: "government", label: "หน่วยงานรัฐ" }, { value: "other", label: "อื่นๆ" },
];

const DEBT_TYPES = [
  { value: "term-loan", label: "สินเชื่อระยะยาว" }, { value: "credit-line", label: "วงเงินสินเชื่อ" },
  { value: "overdraft", label: "เงินเบิกเกินบัญชี" }, { value: "leasing", label: "ลีสซิ่ง/เช่าซื้อ" },
  { value: "mortgage", label: "สินเชื่อจำนอง" }, { value: "personal-loan", label: "กู้ยืมส่วนบุคคล" },
  { value: "supplier-credit", label: "เครดิตซัพพลายเออร์" }, { value: "other", label: "อื่นๆ" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "ทั้งหมด" }, { value: "active", label: "กำลังชำระ" },
  { value: "paid", label: "ชำระครบ" }, { value: "overdue", label: "เกินกำหนด" },
  { value: "restructured", label: "ปรับโครงสร้าง" }, { value: "defaulted", label: "ผิดนัด" },
];

const statusStyle: Record<string, string> = {
  active: "bg-blue-500/20 text-blue-400", paid: "bg-green-500/20 text-green-400",
  overdue: "bg-red-500/20 text-red-400", restructured: "bg-yellow-500/20 text-yellow-400",
  defaulted: "bg-red-500/20 text-red-400", cancelled: "bg-gray-500/20 text-gray-400",
};

const statusLabel: Record<string, string> = {
  active: "กำลังชำระ", paid: "ชำระครบ", overdue: "เกินกำหนด",
  restructured: "ปรับโครงสร้าง", defaulted: "ผิดนัด", cancelled: "ยกเลิก",
};

const creditorIcon: Record<string, typeof Landmark> = {
  bank: Landmark, company: Building2, personal: User, government: FileText, other: CreditCard,
};

const PAYMENT_TYPES = [
  { value: "installment", label: "ผ่อนชำระ (งวด)" }, { value: "lump-sum", label: "ชำระครั้งเดียว" },
  { value: "interest-only", label: "จ่ายเฉพาะดอกเบี้ย" }, { value: "partial", label: "ชำระบางส่วน" },
  { value: "other", label: "อื่นๆ" },
];
const payTypeLabel: Record<string, string> = {
  installment: "ผ่อนงวด", "lump-sum": "ชำระครบ", "interest-only": "เฉพาะดอก", partial: "บางส่วน", other: "อื่นๆ",
};

function baht(n: number) { return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`; }
function pct(n: number) { return `${n.toFixed(2)}%`; }
function fmtSize(bytes: number) { return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`; }

export default function DebtsClient({ debts: initial, stats }: Props) {
  const { isDark } = useTheme();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [debts, setDebts] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // File upload
  const [formFiles, setFormFiles] = useState<{ name: string; type: string; size: number; data: string }[]>([]);
  const [payFiles, setPayFiles] = useState<{ name: string; type: string; size: number; data: string }[]>([]);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: "form" | "pay") => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return; // 10MB limit
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        const entry = { name: file.name, type: file.type, size: file.size, data: base64 };
        if (target === "form") setFormFiles(prev => [...prev, entry]);
        else setPayFiles(prev => [...prev, entry]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // Payment modal
  const [payDebtId, setPayDebtId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ amount: "", interest: "", paymentType: "installment", date: new Date().toISOString().slice(0, 10), note: "" });
  const [paying, setPaying] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const defaultForm = {
    creditor: "", creditorType: "bank", debtType: "term-loan",
    originalAmount: "", interestRate: "", interestType: "fixed",
    monthlyPayment: "", startDate: new Date().toISOString().slice(0, 10),
    dueDate: "", contractNumber: "", collateral: "", guarantor: "", bankAccount: "", note: "",
  };
  const [form, setForm] = useState(defaultForm);

  const filtered = useMemo(() => {
    let data = debts;
    if (statusFilter !== "all") data = data.filter(d => d.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(d => d.creditor.toLowerCase().includes(q) || d.contractNumber.toLowerCase().includes(q));
    }
    return data;
  }, [debts, statusFilter, search]);

  const openAdd = () => { setEditingId(null); setForm(defaultForm); setFormFiles([]); setShowPanel(true); };
  const openEdit = (d: DebtRow) => {
    setEditingId(d._id);
    setForm({
      creditor: d.creditor, creditorType: d.creditorType, debtType: d.debtType,
      originalAmount: String(d.originalAmount), interestRate: String(d.interestRate),
      interestType: d.interestType, monthlyPayment: String(d.monthlyPayment),
      startDate: d.startDate.slice(0, 10), dueDate: d.dueDate.slice(0, 10),
      contractNumber: d.contractNumber, collateral: d.collateral,
      guarantor: d.guarantor, bankAccount: d.bankAccount, note: d.note,
    });
    setShowPanel(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.creditor || !form.originalAmount || !form.dueDate) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/debts/${editingId}` : "/api/debts";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, files: formFiles }) });
      if (res.ok) {
        const json = await res.json();
        const saved = json.data?.debt;
        if (saved) {
          if (editingId) {
            setDebts(prev => prev.map(d => d._id === editingId ? { ...d, ...saved, _id: editingId, payments: saved.payments?.map((p: any) => ({ ...p, _id: String(p._id) })) || d.payments } : d));
          } else {
            setDebts(prev => [{ ...saved, totalPaid: 0, totalInterestPaid: 0, paymentsCount: 0, filesCount: saved.files?.length || 0, payments: [] }, ...prev]);
          }
        }
        setShowPanel(false);
        setFormFiles([]);
      }
    } catch {} finally { setSaving(false); }
  }, [form, editingId, formFiles]);

  const handlePayment = useCallback(async () => {
    if (!payDebtId || !payForm.amount) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/debts/${payDebtId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "payment", amount: Number(payForm.amount), interest: Number(payForm.interest) || 0, paymentType: payForm.paymentType, date: payForm.date, note: payForm.note, files: payFiles }),
      });
      if (res.ok) {
        const json = await res.json();
        const updated = json.data?.debt;
        if (updated) {
          setDebts(prev => prev.map(d => d._id === payDebtId ? {
            ...d,
            remainingBalance: updated.remainingBalance,
            totalPaid: updated.totalPaid,
            totalInterestPaid: updated.totalInterestPaid,
            paymentsCount: updated.payments?.length || d.paymentsCount + 1,
            payments: (updated.payments || []).map((p: any) => ({ ...p, _id: String(p._id) })),
            status: updated.status,
          } : d));
        }
        setPayDebtId(null);
        setPayFiles([]);
      }
    } catch {} finally { setPaying(false); }
  }, [payDebtId, payForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/debts/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) { setDebts(prev => prev.filter(d => d._id !== deleteTarget.id)); setDeleteTarget(null); }
    } catch {} finally { setDeleting(false); }
  }, [deleteTarget]);

  const inp = `w-full h-9 px-3 ${c("bg-white/5 border-white/10 text-white", "bg-gray-50 border-gray-200 text-gray-900")} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`;
  const lbl = `block text-xs ${c("text-white/40", "text-gray-500")} mb-1`;
  const panelBg = c("bg-[#0a0a0a] border-white/10", "bg-white border-gray-200");
  const cardBg = c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200");
  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  const isOverdue = (d: DebtRow) => d.status === "active" && new Date(d.dueDate) < new Date();
  const progressPct = (d: DebtRow) => d.originalAmount > 0 ? Math.round(((d.originalAmount - d.remainingBalance) / d.originalAmount) * 100) : 0;

  const columns: Column<DebtRow>[] = useMemo(() => [
    {
      key: "creditor", label: "เจ้าหนี้",
      render: (r) => {
        const Icon = creditorIcon[r.creditorType] || Landmark;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c("bg-white/[0.06]", "bg-gray-100")}`}>
              <Icon size={16} className={isOverdue(r) ? "text-red-400" : "text-blue-400"} />
            </div>
            <div>
              <p className="font-medium text-sm">{r.creditor}</p>
              <p className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>{DEBT_TYPES.find(t => t.value === r.debtType)?.label} {r.contractNumber && `• ${r.contractNumber}`}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "originalAmount", label: "ยอดกู้", align: "right",
      render: (r) => <Baht value={r.originalAmount} />,
    },
    {
      key: "remainingBalance", label: "คงเหลือ", align: "right",
      render: (r) => (
        <div>
          <Baht value={r.remainingBalance} />
          <div className={`h-1.5 w-16 rounded-full mt-1 ${c("bg-white/10", "bg-gray-200")}`}>
            <div className={`h-full rounded-full ${r.status === "paid" ? "bg-green-400" : isOverdue(r) ? "bg-red-400" : "bg-blue-400"}`} style={{ width: `${progressPct(r)}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: "interestRate", label: "ดอกเบี้ย",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{pct(r.interestRate)} {r.interestType === "floating" ? "(ลอยตัว)" : "(คงที่)"}</span>,
    },
    {
      key: "monthlyPayment", label: "ผ่อน/เดือน", align: "right",
      render: (r) => r.monthlyPayment > 0 ? <Baht value={r.monthlyPayment} /> : <span className={c("text-white/30", "text-gray-400")}>—</span>,
    },
    {
      key: "dueDate", label: "ครบกำหนด",
      render: (r) => {
        const due = new Date(r.dueDate);
        const overdue = isOverdue(r);
        return (
          <div>
            <span className={`text-xs ${overdue ? "text-red-400 font-medium" : c("text-white/60", "text-gray-600")}`}>
              {due.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
            </span>
            {overdue && <span className="block text-[9px] text-red-400">เกินกำหนด</span>}
          </div>
        );
      },
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => {
        const s = isOverdue(r) ? "overdue" : r.status;
        return <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${statusStyle[s]}`}>{statusLabel[s]}</span>;
      },
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r) => (
        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          {r.status === "active" && (
            <button onClick={() => { setPayDebtId(r._id); setPayForm({ amount: String(r.monthlyPayment || ""), interest: "", paymentType: "installment", date: new Date().toISOString().slice(0, 10), note: "" }); setPayFiles([]); }}
              className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-green-400", "hover:bg-gray-100 text-gray-400 hover:text-green-500")}`} title="บันทึกชำระ">
              <Banknote size={14} />
            </button>
          )}
          <button onClick={() => openEdit(r)} className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-blue-400", "hover:bg-gray-100 text-gray-400 hover:text-blue-500")}`} title="แก้ไข"><Pencil size={14} /></button>
          <button onClick={() => setExpandedId(expandedId === r._id ? null : r._id)} className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-purple-400", "hover:bg-gray-100 text-gray-400 hover:text-purple-500")}`} title="ประวัติชำระ">
            <History size={14} />
          </button>
          <button onClick={() => setDeleteTarget({ id: r._id, name: r.creditor })} className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-red-400", "hover:bg-gray-100 text-gray-400 hover:text-red-500")}`} title="ลบ"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ], [isDark, expandedId]);

  return (
    <div className="space-y-6">
      {/* ── Panels & Modals ── */}
      {showPanel && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowPanel(false)} />}
      {showPanel && (
        <div className={`fixed inset-y-0 right-0 z-50 w-[480px] max-w-[95vw] ${panelBg} border-l shadow-2xl overflow-y-auto animate-slide-in-right`}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>{editingId ? "แก้ไขหนี้สิน" : "เพิ่มหนี้สิน"}</h2>
              <button onClick={() => setShowPanel(false)} className={`w-8 h-8 rounded-lg ${c("hover:bg-white/5 text-white/40", "hover:bg-gray-100 text-gray-400")} flex items-center justify-center`}><X size={18} /></button>
            </div>

            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ข้อมูลหนี้</p>
              <div><label className={lbl}>เจ้าหนี้ *</label><input value={form.creditor} onChange={e => setForm({ ...form, creditor: e.target.value })} placeholder="ชื่อเจ้าหนี้ เช่น ธนาคารกสิกร" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ประเภทเจ้าหนี้</label><Select value={form.creditorType} onChange={v => setForm({ ...form, creditorType: v })} options={CREDITOR_TYPES} /></div>
                <div><label className={lbl}>ประเภทหนี้</label><Select value={form.debtType} onChange={v => setForm({ ...form, debtType: v })} options={DEBT_TYPES} /></div>
              </div>
              <div><label className={lbl}>เลขที่สัญญา</label><input value={form.contractNumber} onChange={e => setForm({ ...form, contractNumber: e.target.value })} placeholder="เลขที่สัญญาสินเชื่อ" className={inp} /></div>
            </div>

            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">จำนวนเงิน</p>
              <div><label className={lbl}>ยอดกู้ทั้งหมด (฿) *</label><input type="number" value={form.originalAmount} onChange={e => setForm({ ...form, originalAmount: e.target.value })} placeholder="0" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>อัตราดอกเบี้ย (%)</label><input type="number" step="0.01" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} placeholder="0.00" className={inp} /></div>
                <div><label className={lbl}>ประเภทดอกเบี้ย</label><Select value={form.interestType} onChange={v => setForm({ ...form, interestType: v })} options={[{ value: "fixed", label: "คงที่" }, { value: "floating", label: "ลอยตัว" }]} /></div>
              </div>
              <div><label className={lbl}>ยอดผ่อน/เดือน (฿)</label><input type="number" value={form.monthlyPayment} onChange={e => setForm({ ...form, monthlyPayment: e.target.value })} placeholder="0" className={inp} /></div>
            </div>

            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ระยะเวลา</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>วันเริ่มต้น</label><DatePicker value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} /></div>
                <div><label className={lbl}>วันครบกำหนด *</label><DatePicker value={form.dueDate} onChange={v => setForm({ ...form, dueDate: v })} /></div>
              </div>
            </div>

            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">รายละเอียดเพิ่มเติม</p>
              <div><label className={lbl}>หลักทรัพย์ค้ำประกัน</label><input value={form.collateral} onChange={e => setForm({ ...form, collateral: e.target.value })} placeholder="เช่น โฉนดที่ดิน, รถยนต์" className={inp} /></div>
              <div><label className={lbl}>ผู้ค้ำประกัน</label><input value={form.guarantor} onChange={e => setForm({ ...form, guarantor: e.target.value })} placeholder="ชื่อผู้ค้ำประกัน" className={inp} /></div>
              <div><label className={lbl}>บัญชีหักชำระ</label><input value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} placeholder="เลขบัญชีธนาคาร" className={inp} /></div>
              <div><label className={lbl}>หมายเหตุ</label><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="หมายเหตุเพิ่มเติม" className={inp} /></div>
            </div>

            {/* Files */}
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">เอกสารแนบ</p>
              <label className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${c("border-white/10 hover:border-white/20 text-white/40", "border-gray-200 hover:border-gray-300 text-gray-400")}`}>
                <Upload size={16} />
                <span className="text-xs">คลิกเพื่อแนบไฟล์ (สลิป, สัญญา, เอกสาร)</span>
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => handleFileSelect(e, "form")} className="hidden" />
              </label>
              {formFiles.length > 0 && (
                <div className="space-y-1.5">
                  {formFiles.map((f, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${c("bg-white/[0.03]", "bg-gray-50")}`}>
                      <div className="flex items-center gap-2">
                        <Paperclip size={13} className={c("text-white/40", "text-gray-400")} />
                        <span className={`text-xs truncate max-w-[200px] ${c("text-white/70", "text-gray-600")}`}>{f.name}</span>
                        <span className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>{fmtSize(f.size)}</span>
                      </div>
                      <button onClick={() => setFormFiles(prev => prev.filter((_, j) => j !== i))} className={`p-1 rounded ${c("hover:bg-white/5 text-white/30", "hover:bg-gray-100 text-gray-400")}`}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              <p className={`text-[10px] ${c("text-white/20", "text-gray-400")}`}>รองรับ: รูปภาพ, PDF, Word, Excel (สูงสุด 10MB/ไฟล์)</p>
            </div>

            <div className={`flex gap-2 pt-2 sticky bottom-0 pb-6 ${c("bg-[#0a0a0a]", "bg-white")}`}>
              <button onClick={handleSave} disabled={saving || !form.creditor || !form.originalAmount || !form.dueDate} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{editingId ? "บันทึก" : "เพิ่มหนี้สิน"}
              </button>
              <button onClick={() => setShowPanel(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payDebtId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setPayDebtId(null)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center"><Banknote size={20} className="text-green-400" /></div>
                <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>บันทึกการชำระ</h2>
              </div>
              <div><label className={lbl}>ประเภทการชำระ</label><Select value={payForm.paymentType} onChange={v => setPayForm({ ...payForm, paymentType: v })} options={PAYMENT_TYPES} /></div>
              <div><label className={lbl}>ยอดชำระ (฿) *</label><input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder="0" className={inp} autoFocus /></div>
              <div><label className={lbl}>ส่วนที่เป็นดอกเบี้ย (฿)</label><input type="number" value={payForm.interest} onChange={e => setPayForm({ ...payForm, interest: e.target.value })} placeholder="0" className={inp} /></div>
              <div><label className={lbl}>วันที่ชำระ</label><DatePicker value={payForm.date} onChange={v => setPayForm({ ...payForm, date: v })} /></div>
              <div><label className={lbl}>หมายเหตุ</label><input value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} placeholder="เช่น งวดที่ 12" className={inp} /></div>
              <div>
                <label className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${c("border-white/10 hover:border-white/20 text-white/40", "border-gray-200 hover:border-gray-300 text-gray-400")}`}>
                  <Paperclip size={14} /><span className="text-xs">แนบสลิป/หลักฐานการชำระ</span>
                  <input type="file" multiple accept="image/*,.pdf" onChange={e => handleFileSelect(e, "pay")} className="hidden" />
                </label>
                {payFiles.length > 0 && <div className="mt-2 space-y-1">{payFiles.map((f, i) => (
                  <div key={i} className={`flex items-center justify-between p-1.5 rounded-lg text-xs ${c("bg-white/[0.03] text-white/50", "bg-gray-50 text-gray-500")}`}>
                    <span className="flex items-center gap-1.5 truncate"><Paperclip size={11} />{f.name}</span>
                    <button onClick={() => setPayFiles(prev => prev.filter((_, j) => j !== i))} className="p-0.5"><X size={11} /></button>
                  </div>
                ))}</div>}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handlePayment} disabled={paying || !payForm.amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {paying && <Loader2 size={14} className="animate-spin" />}บันทึกชำระ
                </button>
                <button onClick={() => setPayDebtId(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><AlertTriangle size={20} className="text-red-400" /></div>
                <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>ลบข้อมูลหนี้</h2>
              </div>
              <p className={`text-sm ${c("text-white/60", "text-gray-600")}`}>ลบหนี้สิน <span className="font-bold">&ldquo;{deleteTarget.name}&rdquo;</span>? ข้อมูลและประวัติชำระทั้งหมดจะถูกลบถาวร</p>
              <div className="flex gap-2 pt-2">
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 flex items-center justify-center gap-2">
                  {deleting && <Loader2 size={14} className="animate-spin" />}ลบถาวร
                </button>
                <button onClick={() => setDeleteTarget(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <PageHeader title="หนี้สินบริษัท" description="จัดการหนี้สิน สินเชื่อ และประวัติการชำระทั้งหมด" />

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="หนี้ทั้งหมด" value={baht(stats.totalDebt)} icon={<CircleDollarSign size={20} />} color="text-blue-500" />
        <StatsCard label="ชำระแล้ว" value={baht(stats.totalPaid)} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="คงค้าง" value={baht(stats.totalRemaining)} icon={<Clock size={20} />} color="text-yellow-500" />
        <StatsCard label="เกินกำหนด" value={`${stats.overdue} รายการ`} icon={<AlertTriangle size={20} />} color="text-red-500" />
      </div>

      {/* ── Search + Actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหาเจ้าหนี้, เลขสัญญา..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-36"><Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} /></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25">
          <Plus size={16} />เพิ่มหนี้สิน
        </button>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={r => r._id}
        emptyText="ยังไม่มีข้อมูลหนี้สิน — กด 'เพิ่มหนี้สิน' เพื่อเริ่มต้น"
        columnConfigKey="debts"
      />

      {/* ── Payment History (expanded) ── */}
      {expandedId && (() => {
        const r = debts.find(d => d._id === expandedId);
        if (!r) return null;
        return (
          <div className={`rounded-2xl border p-5 ${c("bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-sm font-bold ${c("text-white", "text-gray-900")}`}>
                <History size={15} className="inline mr-1.5 -mt-0.5 text-purple-400" />ประวัติการชำระ — {r.creditor} ({r.paymentsCount} ครั้ง)
              </h4>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${c("text-white/40", "text-gray-500")}`}>ชำระแล้ว {baht(r.totalPaid)} (ดอกเบี้ย {baht(r.totalInterestPaid)})</span>
                <button onClick={() => setExpandedId(null)} className={`p-1.5 rounded-lg ${c("hover:bg-white/5 text-white/40", "hover:bg-gray-100 text-gray-400")}`}><X size={14} /></button>
              </div>
            </div>
            {r.payments.length > 0 ? (
              <div className="space-y-1.5">
                {r.payments.slice().reverse().map(p => (
                  <div key={p._id} className={`flex items-center justify-between p-3 rounded-xl ${c("bg-white/[0.03] border border-white/[0.04]", "bg-gray-50 border border-gray-100")}`}>
                    <div>
                      <span className={`text-xs font-medium ${c("text-white/70", "text-gray-700")}`}>{new Date(p.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</span>
                      {p.note && <span className={`text-[10px] ml-2 ${c("text-white/30", "text-gray-400")}`}>{p.note}</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-green-400">{baht(p.amount)}</span>
                      <span className={`text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full ${c("bg-white/[0.06] text-white/40", "bg-gray-100 text-gray-500")}`}>{payTypeLabel[p.paymentType] || "ผ่อนงวด"}</span>
                      <span className={`text-[10px] ml-2 ${c("text-white/30", "text-gray-400")}`}>เงินต้น {baht(p.principal)} | ดอกเบี้ย {baht(p.interest)}</span>
                      {p.files && p.files.length > 0 && <span className={`text-[10px] ml-1.5 ${c("text-white/30", "text-gray-400")}`}><Paperclip size={10} className="inline -mt-0.5" /> {p.files.length}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-xs text-center py-6 ${c("text-white/30", "text-gray-400")}`}>ยังไม่มีประวัติการชำระ</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
