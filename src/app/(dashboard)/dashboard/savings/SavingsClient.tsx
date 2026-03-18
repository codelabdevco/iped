"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { PiggyBank, Target, TrendingUp, Plus, Pencil, Trash2, Loader2, ImageIcon, MessageCircle, Globe, X } from "lucide-react";
import GoalCard from "@/components/dashboard/GoalCard";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
import TimePicker from "@/components/dashboard/TimePicker";
import Baht from "@/components/dashboard/Baht";
import DeleteConfirmModal from "@/components/dashboard/DeleteConfirmModal";

interface SavingsRow {
  _id: string;
  storeName: string;
  amount: number;
  category: string;
  date: string;
  rawDate?: string;
  time?: string;
  status: string;
  type: string;
  source: string;
  paymentMethod?: string;
  note?: string;
  hasImage?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const SAVING_CATEGORIES = [
  { value: "ท่องเที่ยว", label: "ท่องเที่ยว", dot: "#818CF8" },
  { value: "ซื้อของ", label: "ซื้อของ", dot: "#FB923C" },
  { value: "กองทุนฉุกเฉิน", label: "กองทุนฉุกเฉิน", dot: "#34D399" },
  { value: "ลงทุน", label: "ลงทุน", dot: "#8b5cf6" },
  { value: "การศึกษา", label: "การศึกษา", dot: "#FBBF24" },
  { value: "บ้าน/รถ", label: "บ้าน/รถ", dot: "#60A5FA" },
  { value: "เกษียณ", label: "เกษียณ", dot: "#F472B6" },
  { value: "เงินออม", label: "เงินออม", dot: "#ec4899" },
  { value: "อื่นๆ", label: "อื่นๆ", dot: "#78716c" },
];

const SAVING_METHODS = [
  { value: "transfer", label: "โอนเข้าบัญชีออม" },
  { value: "cash", label: "หยอดกระปุก" },
  { value: "debit", label: "ตัดบัตรอัตโนมัติ" },
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
      className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${imgUrl ? "cursor-pointer hover:ring-2 hover:ring-pink-500/50 transition-all" : ""} ${isDark ? "bg-white/5" : "bg-gray-100"}`}
      onClick={imgUrl ? (e) => { e.stopPropagation(); onClickFull(imgUrl); } : undefined}
    >
      {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" loading="lazy" /> : <ImageIcon size={16} className={muted} />}
    </div>
  );
}

export default function SavingsClient({ savings: initial }: { savings: SavingsRow[] }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [savings, setSavings] = useState(initial);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSavingState] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    storeName: "", amount: "", category: "เงินออม", date: new Date().toISOString().slice(0, 10),
    time: "", paymentMethod: "transfer", note: "",
  });

  // Sync server data
  const prevRef = useRef("");
  useEffect(() => {
    const ids = initial.map((r) => r._id + r.amount).join(",");
    if (ids === prevRef.current) return;
    prevRef.current = ids;
    setSavings(initial);
  }, [initial]);

  // Poll
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/receipts/poll");
        if (!res.ok) return;
        router.refresh();
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const muted = isDark ? "text-white/30" : "text-gray-400";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";

  // Stats
  const active = savings.filter((s) => s.status !== "cancelled");
  const totalSaved = active.reduce((sum, s) => sum + s.amount, 0);
  const now2 = new Date();
  const thisMonthStart = new Date(now2.getFullYear(), now2.getMonth(), 1);
  const lastMonthStart = new Date(now2.getFullYear(), now2.getMonth() - 1, 1);
  const thisMonth = active.filter((s) => new Date(s.createdAt || s.rawDate || "") >= thisMonthStart).reduce((sum, s) => sum + s.amount, 0);
  const lastMonth = active.filter((s) => { const d = new Date(s.createdAt || s.rawDate || ""); return d >= lastMonthStart && d < thisMonthStart; }).reduce((sum, s) => sum + s.amount, 0);
  const count = savings.length;

  const getCatColor = (cat: string) => SAVING_CATEGORIES.find((c) => c.value === cat)?.dot || "#ec4899";

  const handleAdd = () => {
    setEditingId(null);
    setForm({ storeName: "", amount: "", category: "เงินออม", date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }), paymentMethod: "transfer", note: "" });
    setIsAdding(true);
  };

  const handleEdit = (r: SavingsRow) => {
    setEditingId(r._id);
    setForm({ storeName: r.storeName, amount: String(r.amount), category: r.category, date: r.rawDate || "", time: r.time || "", paymentMethod: r.paymentMethod || "transfer", note: r.note || "" });
    setIsAdding(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const handleDelete = useCallback((id: string) => { setDeleteTarget(id); }, []);
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try { await fetch(`/api/receipts/${deleteTarget}`, { method: "DELETE" }); setSavings((prev) => prev.filter((r) => r._id !== deleteTarget)); } catch {}
    setDeleteTarget(null); router.refresh();
  }, [deleteTarget, router]);

  const handleSave = async () => {
    if (!form.storeName || !form.amount) return;
    setSavingState(true);
    const amount = Number(form.amount);
    try {
      if (editingId) {
        await fetch(`/api/receipts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchant: form.storeName, amount, date: form.date, time: form.time, category: form.category, paymentMethod: form.paymentMethod, note: form.note, direction: "savings" }),
        });
        setSavings((prev) => prev.map((r) => r._id === editingId ? { ...r, storeName: form.storeName, amount, category: form.category, rawDate: form.date, time: form.time, paymentMethod: form.paymentMethod, note: form.note } : r));
      } else {
        const res = await fetch("/api/receipts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchant: form.storeName, amount, date: form.date, category: form.category, categoryIcon: "🐷", type: "receipt", paymentMethod: form.paymentMethod, note: form.note, source: "web", status: "confirmed", direction: "savings" }),
        });
        if (res.ok) {
          const json = await res.json();
          setSavings((prev) => [{ _id: json.receipt?._id || `temp-${Date.now()}`, storeName: form.storeName, amount, category: form.category, date: new Date(form.date).toLocaleDateString("th-TH"), rawDate: form.date, time: form.time, status: "confirmed", type: "receipt", source: "web", paymentMethod: form.paymentMethod, note: form.note, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]);
        }
      }
      setIsAdding(false);
      setEditingId(null);
    } catch {} finally {
      setSavingState(false);
    }
  };

  const columns: Column<SavingsRow>[] = useMemo(() => [
    { key: "image", label: "รูป", configurable: false, render: (r, dark) => <LazyImage id={r._id} hasImage={r.hasImage} onClickFull={setLightboxUrl} isDark={dark} /> },
    { key: "storeName", label: "รายละเอียด", render: (r) => (<div className="leading-tight min-w-0"><div className="font-medium truncate">{r.storeName}</div><div className={`flex items-center gap-2 mt-0.5 text-[11px] ${muted}`}><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(r.category) }} />{r.category}</span></div></div>) },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} direction="savings" className="font-semibold text-pink-400" /> },
    { key: "paidAt", label: "วันที่ออม", render: (r) => { const iso = r.rawDate; if (!iso) return <span className={muted}>-</span>; const d = new Date(iso); const day = d.getDate(); const mon = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()]; const yr = d.getFullYear() + 543; const time = r.time || ""; const isLine = r.source === "line"; return (<div className="leading-tight"><div className="text-sm whitespace-nowrap">{day} {mon} {yr}{time ? <span className={`text-[11px] ml-1 ${muted}`}>{time}</span> : ""}</div><div className={`flex items-center gap-1 mt-0.5 text-[11px] ${isLine ? "text-green-500" : "text-pink-400"}`}>{isLine ? <MessageCircle size={10} /> : <Globe size={10} />}{isLine ? "LINE" : "เว็บ"}</div></div>); } },
    { key: "paymentMethod", label: "วิธีออม", render: (r) => <span className="text-xs">{SAVING_METHODS.find((m) => m.value === r.paymentMethod)?.label || r.paymentMethod || "-"}</span> },
    { key: "note", label: "หมายเหตุ", defaultVisible: false, render: (r) => <span className={`truncate max-w-[150px] inline-block ${muted}`}>{r.note || "-"}</span> },
    { key: "status", label: "สถานะ", render: (r) => { const st = statusMap[r.status] || statusMap.confirmed; return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span>; } },
    { key: "actions", label: "", configurable: false, render: (r, dark) => (<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}><button onClick={() => handleEdit(r)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-pink-400" : "hover:bg-gray-100 text-gray-400 hover:text-pink-500"}`}><Pencil size={14} /></button><button onClick={() => handleDelete(r._id)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}><Trash2 size={14} /></button></div>) },
  ], [muted, handleDelete]);

  const inp = "w-full h-9 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-pink-500/50";
  const lbl = "block text-xs text-white/40 mb-1";

  return (
    <div className="space-y-6">
      {/* Add/Edit panel */}
      {isAdding && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => { setIsAdding(false); setEditingId(null); }} />}
      {isAdding && (
        <div className="fixed inset-y-0 right-0 z-50 w-[440px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingId ? "แก้ไขเงินออม" : "เพิ่มเงินออม"}</h2>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl">&times;</button>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-pink-400/70">บันทึกเงินออม</p>
              <div><label className={lbl}>เป้าหมาย / ชื่อรายการ</label><input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder="เช่น ท่องเที่ยวญี่ปุ่น, กองทุนฉุกเฉิน" className={inp} /></div>
              <div><label className={lbl}>จำนวนที่ออม (฿)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>หมวดหมู่</label><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={SAVING_CATEGORIES} /></div>
                <div><label className={lbl}>วิธีออม</label><Select value={form.paymentMethod} onChange={(v) => setForm({ ...form, paymentMethod: v })} options={SAVING_METHODS} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>วันที่ออม</label><DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
                <div><label className={lbl}>เวลา</label><TimePicker value={form.time} onChange={(v) => setForm({ ...form, time: v })} /></div>
              </div>
              <div><label className={lbl}>หมายเหตุ</label><textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="เช่น ออมจากเงินทอน, โบนัส..." className={`${inp} h-auto py-2`} /></div>
            </div>

            {/* Total card */}
            {form.amount && (
              <div className="rounded-xl p-4 bg-pink-500/10 border border-pink-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/70">ออมครั้งนี้</span>
                  <span className="text-2xl font-bold text-white">฿{Number(form.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button onClick={handleSave} disabled={saving || !form.storeName || !form.amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-pink-500 text-white hover:bg-pink-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "บันทึก" : "เพิ่มเงินออม"}
              </button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="เงินออม" description={`${count} รายการ — รวม ฿${totalSaved.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} />
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-pink-500 text-white hover:bg-pink-600 transition-colors shadow-sm shadow-pink-500/25">
          <Plus size={16} />เพิ่มเงินออม
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ออมแล้วทั้งหมด" value={`฿${totalSaved.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<PiggyBank size={20} />} color="text-pink-500" />
        <StatsCard label="ออมเดือนนี้" value={`฿${thisMonth.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingUp size={20} />} color="text-green-500" />
        <StatsCard label="เดือนที่แล้ว" value={`฿${lastMonth.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Target size={20} />} color="text-blue-500" />
        <StatsCard label="จำนวนครั้ง" value={`${count} ครั้ง`} icon={<Target size={20} />} color="text-purple-500" />
      </div>

      <GoalCard storageKey="goal-savings" current={thisMonth} label="เป้าออม" color="pink" />
      <DataTable columns={columns} data={savings} rowKey={(r) => r._id} dateField="rawDate" columnConfigKey="savings" />
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
