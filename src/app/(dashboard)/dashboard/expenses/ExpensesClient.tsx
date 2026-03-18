"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { TrendingDown, Hash, Calculator, Plus, Pencil, Trash2, Loader2, MessageCircle, Globe } from "lucide-react";
import GoalCard from "@/components/dashboard/GoalCard";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
import TimePicker from "@/components/dashboard/TimePicker";
import Baht from "@/components/dashboard/Baht";

interface ExpenseRow {
  _id: string; storeName: string; amount: number; category: string;
  date: string; rawDate?: string; time?: string; status: string;
  source: string; paymentMethod?: string; note?: string;
  hasImage?: boolean; createdAt?: string; updatedAt?: string;
}

const EXPENSE_CATEGORIES = [
  { value: "อาหาร", label: "อาหาร", dot: "#FB923C" },
  { value: "เดินทาง", label: "เดินทาง", dot: "#60A5FA" },
  { value: "ช็อปปิ้ง", label: "ช็อปปิ้ง", dot: "#818CF8" },
  { value: "สาธารณูปโภค", label: "สาธารณูปโภค", dot: "#F472B6" },
  { value: "ของใช้ในบ้าน", label: "ของใช้ในบ้าน", dot: "#C084FC" },
  { value: "สุขภาพ", label: "สุขภาพ", dot: "#34D399" },
  { value: "การศึกษา", label: "การศึกษา", dot: "#FBBF24" },
  { value: "บันเทิง", label: "บันเทิง", dot: "#F87171" },
  { value: "ที่พัก", label: "ที่พัก", dot: "#A78BFA" },
  { value: "ธุรกิจ", label: "ธุรกิจ", dot: "#F59E0B" },
  { value: "อื่นๆ", label: "อื่นๆ", dot: "#78716C" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "เงินสด" },
  { value: "promptpay", label: "พร้อมเพย์" },
  { value: "transfer", label: "โอนธนาคาร" },
  { value: "credit", label: "บัตรเครดิต" },
  { value: "debit", label: "บัตรเดบิต" },
  { value: "bank-scb", label: "SCB ไทยพาณิชย์" },
  { value: "bank-kbank", label: "KBank กสิกร" },
  { value: "bank-bbl", label: "BBL กรุงเทพ" },
  { value: "bank-ktb", label: "KTB กรุงไทย" },
  { value: "other", label: "อื่นๆ" },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "ยืนยัน", cls: "bg-green-500/10 text-green-400" },
  pending: { label: "รอตรวจ", cls: "bg-yellow-500/10 text-yellow-400" },
  edited: { label: "แก้ไข", cls: "bg-blue-500/10 text-blue-400" },
  duplicate: { label: "ซ้ำ", cls: "bg-orange-500/10 text-orange-400" },
  cancelled: { label: "ยกเลิก", cls: "bg-gray-500/10 text-gray-400" },
};

export default function ExpensesClient({ expenses: initial }: { expenses: ExpenseRow[] }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [expenses, setExpenses] = useState(initial);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ storeName: "", amount: "", category: "อาหาร", date: new Date().toISOString().slice(0, 10), time: "", paymentMethod: "cash", note: "" });

  const prevRef = useRef("");
  useEffect(() => { const ids = initial.map((r) => r._id + r.amount).join(","); if (ids === prevRef.current) return; prevRef.current = ids; setExpenses(initial); }, [initial]);
  useEffect(() => { const i = setInterval(async () => { try { await fetch("/api/receipts/poll"); router.refresh(); } catch {} }, 5000); return () => clearInterval(i); }, [router]);

  const muted = isDark ? "text-white/30" : "text-gray-400";
  const confirmed = expenses.filter((r) => r.status === "confirmed");
  const totalAmount = confirmed.reduce((s, r) => s + r.amount, 0);
  const count = expenses.length;
  const pending = expenses.filter((r) => r.status === "pending").length;
  const now2 = new Date();
  const thisMonthStart = new Date(now2.getFullYear(), now2.getMonth(), 1);
  const thisMonth = confirmed.filter((r) => new Date(r.rawDate || r.createdAt || "") >= thisMonthStart).reduce((s, r) => s + r.amount, 0);

  const getCatColor = (cat: string) => EXPENSE_CATEGORIES.find((c) => c.value === cat)?.dot || "#78716C";

  const handleAdd = () => { setEditingId(null); setForm({ storeName: "", amount: "", category: "อาหาร", date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }), paymentMethod: "cash", note: "" }); setIsAdding(true); };
  const handleEdit = (r: ExpenseRow) => { setEditingId(r._id); setForm({ storeName: r.storeName, amount: String(r.amount), category: r.category, date: r.rawDate || "", time: r.time || "", paymentMethod: r.paymentMethod || "cash", note: r.note || "" }); setIsAdding(true); };
  const handleDelete = useCallback((id: string) => { if (confirm("ลบรายการนี้?")) setExpenses((prev) => prev.filter((r) => r._id !== id)); }, []);

  const handleSave = async () => {
    if (!form.storeName || !form.amount) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/receipts/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchant: form.storeName, amount: Number(form.amount), date: form.date, time: form.time, category: form.category, paymentMethod: form.paymentMethod, note: form.note, direction: "expense" }) });
        setExpenses((prev) => prev.map((r) => r._id === editingId ? { ...r, storeName: form.storeName, amount: Number(form.amount), category: form.category, rawDate: form.date, time: form.time, paymentMethod: form.paymentMethod, note: form.note } : r));
      } else {
        const res = await fetch("/api/receipts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchant: form.storeName, amount: Number(form.amount), date: form.date, category: form.category, categoryIcon: "📋", type: "receipt", paymentMethod: form.paymentMethod, note: form.note, source: "web", status: "confirmed", direction: "expense" }) });
        if (res.ok) { const json = await res.json(); setExpenses((prev) => [{ _id: json.receipt?._id || `temp-${Date.now()}`, storeName: form.storeName, amount: Number(form.amount), category: form.category, date: new Date(form.date).toLocaleDateString("th-TH"), rawDate: form.date, time: form.time, status: "confirmed", source: "web", paymentMethod: form.paymentMethod, note: form.note, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]); }
      }
      setIsAdding(false); setEditingId(null);
    } catch {} finally { setSaving(false); }
  };

  const columns: Column<ExpenseRow>[] = useMemo(() => [
    { key: "storeName", label: "รายละเอียด", render: (r) => (<div className="leading-tight min-w-0"><div className="font-medium truncate">{r.storeName}</div><div className={`flex items-center gap-2 mt-0.5 text-[11px] ${muted}`}><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(r.category) }} />{r.category}</span></div></div>) },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} direction="expense" className="font-semibold" /> },
    { key: "paidAt", label: "วันที่จ่าย", render: (r) => { const iso = r.rawDate; if (!iso) return <span className={muted}>-</span>; const d = new Date(iso); const day = d.getDate(); const mon = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()]; const yr = d.getFullYear() + 543; const time = r.time || ""; const isLine = r.source === "line"; return (<div className="leading-tight"><div className="text-sm whitespace-nowrap">{day} {mon} {yr}{time ? <span className={`text-[11px] ml-1 ${muted}`}>{time}</span> : ""}</div><div className={`flex items-center gap-1 mt-0.5 text-[11px] ${isLine ? "text-green-500" : "text-blue-400"}`}>{isLine ? <MessageCircle size={10} /> : <Globe size={10} />}{isLine ? "LINE" : "เว็บ"}</div></div>); } },
    { key: "paymentMethod", label: "วิธีจ่าย", render: (r) => <span className="text-xs">{PAYMENT_METHODS.find((m) => m.value === r.paymentMethod)?.label || r.paymentMethod || "-"}</span> },
    { key: "status", label: "สถานะ", render: (r) => { const st = statusMap[r.status] || statusMap.pending; return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span>; } },
    { key: "actions", label: "", configurable: false, render: (r, dark) => (<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}><button onClick={() => handleEdit(r)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-blue-400" : "hover:bg-gray-100 text-gray-400 hover:text-blue-500"}`}><Pencil size={14} /></button><button onClick={() => handleDelete(r._id)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}><Trash2 size={14} /></button></div>) },
  ], [muted, handleDelete]);

  const inp = "w-full h-9 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50";
  const lbl = "block text-xs text-white/40 mb-1";

  return (
    <div className="space-y-6">
      {isAdding && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => { setIsAdding(false); setEditingId(null); }} />}
      {isAdding && (
        <div className="fixed inset-y-0 right-0 z-50 w-[440px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingId ? "แก้ไขรายจ่าย" : "เพิ่มรายจ่าย"}</h2>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl">&times;</button>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-[#FA3633]/70">ข้อมูลรายจ่าย</p>
              <div><label className={lbl}>ร้านค้า / รายการ</label><input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder="เช่น 7-Eleven, Grab Food" className={inp} /></div>
              <div><label className={lbl}>จำนวนเงิน (฿)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>หมวดหมู่</label><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={EXPENSE_CATEGORIES} /></div>
                <div><label className={lbl}>วิธีจ่าย</label><Select value={form.paymentMethod} onChange={(v) => setForm({ ...form, paymentMethod: v })} options={PAYMENT_METHODS} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>วันที่จ่าย</label><DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
                <div><label className={lbl}>เวลา</label><TimePicker value={form.time} onChange={(v) => setForm({ ...form, time: v })} /></div>
              </div>
              <div><label className={lbl}>หมายเหตุ</label><textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="รายละเอียดเพิ่มเติม..." className={`${inp} h-auto py-2`} /></div>
            </div>
            {form.amount && (
              <div className="rounded-xl p-4 bg-[#FA3633]/10 border border-[#FA3633]/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/70">ยอดจ่าย</span>
                  <span className="text-2xl font-bold text-white">฿{Number(form.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button onClick={handleSave} disabled={saving || !form.storeName || !form.amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">{saving && <Loader2 size={14} className="animate-spin" />}{editingId ? "บันทึก" : "เพิ่มรายจ่าย"}</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="รายจ่าย" description={`${count} รายการ — ยืนยันแล้ว ฿${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} />
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25"><Plus size={16} />เพิ่มรายจ่าย</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="รายจ่ายทั้งหมด" value={`฿${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingDown size={20} />} color="text-[#FA3633]" />
        <StatsCard label="เดือนนี้" value={`฿${thisMonth.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Calculator size={20} />} color="text-blue-500" />
        <StatsCard label="รอตรวจสอบ" value={`${pending} รายการ`} icon={<Hash size={20} />} color="text-yellow-500" />
        <StatsCard label="จำนวนรายการ" value={`${count} รายการ`} icon={<Hash size={20} />} color="text-purple-500" />
      </div>
      <GoalCard storageKey="goal-expense" current={thisMonth} label="งบรายจ่าย" color="red" />
      <DataTable columns={columns} data={expenses} rowKey={(r) => r._id} dateField="rawDate" columnConfigKey="expenses" />
    </div>
  );
}
