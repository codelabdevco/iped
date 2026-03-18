"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Wallet, TrendingUp, BarChart3, Hash, Plus, Pencil, Trash2, Loader2, MessageCircle, Globe, ImageIcon, X } from "lucide-react";
import GoalCard from "@/components/dashboard/GoalCard";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
import TimePicker from "@/components/dashboard/TimePicker";
import Baht from "@/components/dashboard/Baht";
import DeleteConfirmModal from "@/components/dashboard/DeleteConfirmModal";

interface IncomeRow {
  _id: string; storeName: string; amount: number; category: string;
  date: string; rawDate?: string; time?: string; status: string;
  source: string; paymentMethod?: string; note?: string;
  hasImage?: boolean; createdAt?: string; updatedAt?: string;
}

const INCOME_CATEGORIES = [
  { value: "เงินเดือน", label: "เงินเดือน", dot: "#22c55e" },
  { value: "ฟรีแลนซ์", label: "ฟรีแลนซ์", dot: "#3b82f6" },
  { value: "ขายของ", label: "ขายของ", dot: "#f59e0b" },
  { value: "ลงทุน", label: "ลงทุน", dot: "#8b5cf6" },
  { value: "ดอกเบี้ย", label: "ดอกเบี้ย", dot: "#06b6d4" },
  { value: "โบนัส", label: "โบนัส", dot: "#ec4899" },
  { value: "คืนเงิน", label: "คืนเงิน", dot: "#14b8a6" },
  { value: "อื่นๆ", label: "อื่นๆ", dot: "#78716c" },
];

const PAYMENT_METHODS = [
  { value: "transfer", label: "โอนธนาคาร" },
  { value: "cash", label: "เงินสด" },
  { value: "promptpay", label: "พร้อมเพย์" },
  { value: "cheque", label: "เช็ค" },
  { value: "other", label: "อื่นๆ" },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "ยืนยัน", cls: "bg-green-500/10 text-green-400" },
  pending: { label: "รอตรวจ", cls: "bg-yellow-500/10 text-yellow-400" },
  edited: { label: "แก้ไข", cls: "bg-blue-500/10 text-blue-400" },
  cancelled: { label: "ยกเลิก", cls: "bg-gray-500/10 text-gray-400" },
};

function LazyImage({ id, hasImage, onClickFull, isDark }: { id: string; hasImage?: boolean; onClickFull: (url: string) => void; isDark: boolean }) {
  const imgUrl = hasImage ? `/api/receipts/image?id=${id}` : null;
  const muted = isDark ? "text-white/30" : "text-gray-400";
  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${imgUrl ? "cursor-pointer hover:ring-2 hover:ring-green-500/50 transition-all" : ""} ${isDark ? "bg-white/5" : "bg-gray-100"}`}
      onClick={imgUrl ? (e) => { e.stopPropagation(); onClickFull(imgUrl); } : undefined}
    >
      {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" loading="lazy" /> : <ImageIcon size={16} className={muted} />}
    </div>
  );
}

export default function IncomeClient({ incomes: initial }: { incomes: IncomeRow[] }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [incomes, setIncomes] = useState(initial);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [form, setForm] = useState({ storeName: "", amount: "", category: "เงินเดือน", date: new Date().toISOString().slice(0, 10), time: "", paymentMethod: "transfer", note: "" });

  const prevRef = useRef("");
  useEffect(() => { const ids = initial.map((r) => r._id + r.amount).join(","); if (ids === prevRef.current) return; prevRef.current = ids; setIncomes(initial); }, [initial]);
  useEffect(() => { const i = setInterval(async () => { try { await fetch("/api/receipts/poll"); router.refresh(); } catch {} }, 5000); return () => clearInterval(i); }, [router]);

  const muted = isDark ? "text-white/30" : "text-gray-400";
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const confirmed = incomes.filter((r) => r.status !== "cancelled");
  const totalAmount = confirmed.reduce((s, r) => s + r.amount, 0);
  const count = incomes.length;
  let thisMonth = 0, lastMonth = 0;
  confirmed.forEach((r) => { const d = new Date(r.rawDate || r.createdAt || ""); if (d >= thisMonthStart) thisMonth += r.amount; else if (d >= lastMonthStart) lastMonth += r.amount; });

  const getCatColor = (cat: string) => INCOME_CATEGORIES.find((c) => c.value === cat)?.dot || "#22c55e";

  const handleAdd = () => { setEditingId(null); setForm({ storeName: "", amount: "", category: "เงินเดือน", date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }), paymentMethod: "transfer", note: "" }); setIsAdding(true); };
  const handleEdit = (r: IncomeRow) => { setEditingId(r._id); setForm({ storeName: r.storeName, amount: String(r.amount), category: r.category, date: r.rawDate || "", time: r.time || "", paymentMethod: r.paymentMethod || "transfer", note: r.note || "" }); setIsAdding(true); };
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const handleDelete = useCallback((id: string) => { setDeleteTarget(id); }, []);
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try { await fetch(`/api/receipts/${deleteTarget}`, { method: "DELETE" }); setIncomes((prev) => prev.filter((r) => r._id !== deleteTarget)); } catch {}
    setDeleteTarget(null); router.refresh();
  }, [deleteTarget, router]);

  const handleSave = async () => {
    if (!form.storeName || !form.amount) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/receipts/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchant: form.storeName, amount: Number(form.amount), date: form.date, time: form.time, category: form.category, paymentMethod: form.paymentMethod, note: form.note, direction: "income" }) });
        setIncomes((prev) => prev.map((r) => r._id === editingId ? { ...r, storeName: form.storeName, amount: Number(form.amount), category: form.category, rawDate: form.date, time: form.time, paymentMethod: form.paymentMethod, note: form.note } : r));
      } else {
        const res = await fetch("/api/receipts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchant: form.storeName, amount: Number(form.amount), date: form.date, category: form.category, categoryIcon: "💰", type: "receipt", paymentMethod: form.paymentMethod, note: form.note, source: "web", status: "confirmed", direction: "income" }) });
        if (res.ok) { const json = await res.json(); setIncomes((prev) => [{ _id: json.receipt?._id || `temp-${Date.now()}`, storeName: form.storeName, amount: Number(form.amount), category: form.category, date: new Date(form.date).toLocaleDateString("th-TH"), rawDate: form.date, time: form.time, status: "confirmed", source: "web", paymentMethod: form.paymentMethod, note: form.note, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]); }
      }
      setIsAdding(false); setEditingId(null);
    } catch {} finally { setSaving(false); }
  };

  const columns: Column<IncomeRow>[] = useMemo(() => [
    { key: "image", label: "รูป", configurable: false, render: (r, dark) => <LazyImage id={r._id} hasImage={r.hasImage} onClickFull={setLightboxUrl} isDark={dark} /> },
    { key: "storeName", label: "รายละเอียด", render: (r) => (<div className="leading-tight min-w-0"><div className="font-medium truncate">{r.storeName}</div><div className={`flex items-center gap-2 mt-0.5 text-[11px] ${muted}`}><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(r.category) }} />{r.category}</span></div></div>) },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} direction="income" className="font-semibold text-green-500" /> },
    { key: "paidAt", label: "วันที่รับ", render: (r) => { const iso = r.rawDate; if (!iso) return <span className={muted}>-</span>; const d = new Date(iso); const day = d.getDate(); const mon = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()]; const yr = d.getFullYear() + 543; const time = r.time || ""; const isLine = r.source === "line"; return (<div className="leading-tight"><div className="text-sm whitespace-nowrap">{day} {mon} {yr}{time ? <span className={`text-[11px] ml-1 ${muted}`}>{time}</span> : ""}</div><div className={`flex items-center gap-1 mt-0.5 text-[11px] ${isLine ? "text-green-500" : "text-green-400"}`}>{isLine ? <MessageCircle size={10} /> : <Globe size={10} />}{isLine ? "LINE" : "เว็บ"}</div></div>); } },
    { key: "paymentMethod", label: "วิธีรับ", render: (r) => <span className="text-xs">{PAYMENT_METHODS.find((m) => m.value === r.paymentMethod)?.label || r.paymentMethod || "-"}</span> },
    { key: "note", label: "หมายเหตุ", defaultVisible: false, render: (r) => <span className={`truncate max-w-[150px] inline-block ${muted}`}>{r.note || "-"}</span> },
    { key: "status", label: "สถานะ", render: (r) => { const st = statusMap[r.status] || statusMap.confirmed; return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span>; } },
    { key: "actions", label: "", configurable: false, render: (r, dark) => (<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}><button onClick={() => handleEdit(r)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-green-400" : "hover:bg-gray-100 text-gray-400 hover:text-green-500"}`}><Pencil size={14} /></button><button onClick={() => handleDelete(r._id)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}><Trash2 size={14} /></button></div>) },
  ], [muted, handleDelete]);

  const inp = "w-full h-9 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-green-500/50";
  const lbl = "block text-xs text-white/40 mb-1";

  return (
    <div className="space-y-6">
      {isAdding && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => { setIsAdding(false); setEditingId(null); }} />}
      {isAdding && (
        <div className="fixed inset-y-0 right-0 z-50 w-[440px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingId ? "แก้ไขรายรับ" : "เพิ่มรายรับ"}</h2>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl">&times;</button>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-green-500/70">ข้อมูลรายรับ</p>
              <div><label className={lbl}>แหล่งที่มา</label><input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder="เช่น บริษัท ABC, ลูกค้า, ฟรีแลนซ์" className={inp} /></div>
              <div><label className={lbl}>จำนวนเงิน (฿)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>หมวดรายรับ</label><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={INCOME_CATEGORIES} /></div>
                <div><label className={lbl}>วิธีรับเงิน</label><Select value={form.paymentMethod} onChange={(v) => setForm({ ...form, paymentMethod: v })} options={PAYMENT_METHODS} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>วันที่รับ</label><DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
                <div><label className={lbl}>เวลา</label><TimePicker value={form.time} onChange={(v) => setForm({ ...form, time: v })} /></div>
              </div>
              <div><label className={lbl}>หมายเหตุ</label><textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="รายละเอียดเพิ่มเติม..." className={`${inp} h-auto py-2`} /></div>
            </div>
            {form.amount && (
              <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/70">ยอดรับ</span>
                  <span className="text-2xl font-bold text-white">฿{Number(form.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button onClick={handleSave} disabled={saving || !form.storeName || !form.amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">{saving && <Loader2 size={14} className="animate-spin" />}{editingId ? "บันทึก" : "เพิ่มรายรับ"}</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="รายรับ" description={`${incomes.length} รายการ — รวม ฿${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} />
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm shadow-green-500/25"><Plus size={16} />เพิ่มรายรับ</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="รายรับทั้งหมด" value={`฿${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Wallet size={20} />} color="text-green-500" />
        <StatsCard label="เดือนนี้" value={`฿${thisMonth.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingUp size={20} />} color="text-blue-500" />
        <StatsCard label="เดือนที่แล้ว" value={`฿${lastMonth.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<BarChart3 size={20} />} color="text-purple-500" />
        <StatsCard label="จำนวนรายการ" value={`${count} รายการ`} icon={<Hash size={20} />} color="text-orange-500" />
      </div>
      <GoalCard storageKey="goal-income" current={thisMonth} label="เป้ารายรับ" color="green" />
      <DataTable columns={columns} data={incomes} rowKey={(r) => r._id} dateField="rawDate" columnConfigKey="income" />
      <DeleteConfirmModal open={!!deleteTarget} receiptId={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      {lightboxUrl && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 z-10"><X size={20} /></button>
          <img src={lightboxUrl} alt="" className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
