"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Wallet, ArrowUpRight, BarChart3, Plus, Loader2, Trash2, Upload, X } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";

interface IncomeEntry {
  _id: string;
  date: string;
  merchant: string;
  category: string;
  categoryIcon: string;
  amount: number;
  note?: string;
  paymentMethod?: string;
  createdAt?: string;
}

const CATEGORIES = [
  { value: "เงินเดือน", label: "เงินเดือน", dot: "#22c55e" },
  { value: "ฟรีแลนซ์", label: "ฟรีแลนซ์", dot: "#3b82f6" },
  { value: "ขายของ", label: "ขายของ", dot: "#f59e0b" },
  { value: "ลงทุน", label: "ลงทุน", dot: "#8b5cf6" },
  { value: "ดอกเบี้ย", label: "ดอกเบี้ย", dot: "#06b6d4" },
  { value: "โบนัส", label: "โบนัส", dot: "#ec4899" },
  { value: "คืนภาษี", label: "คืนภาษี", dot: "#14b8a6" },
  { value: "อื่นๆ", label: "อื่นๆ", dot: "#78716c" },
];

const PAYMENT_METHODS = [
  { value: "transfer", label: "โอนธนาคาร" },
  { value: "cash", label: "เงินสด" },
  { value: "cheque", label: "เช็ค" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "other", label: "อื่นๆ" },
];

function Baht({ value, className = "" }: { value: number; className?: string }) {
  const whole = Math.floor(Math.abs(value)).toLocaleString();
  const dec = (Math.abs(value) % 1).toFixed(2).slice(1);
  return <span className={className}>{value < 0 ? "-" : ""}฿{whole}<span className="text-[0.75em] opacity-50">{dec}</span></span>;
}

interface Props {
  incomes: IncomeEntry[];
  thisMonth: number;
  lastMonth: number;
}

export default function IncomeClient({ incomes: initial, thisMonth: initThis, lastMonth: initLast }: Props) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [incomes, setIncomes] = useState(initial);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ merchant: "", category: "เงินเดือน", date: new Date().toISOString().slice(0, 10), amount: "", note: "", paymentMethod: "transfer" });

  const muted = isDark ? "text-white/30" : "text-gray-400";

  // Recalculate stats from local state
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let thisMonth = 0, lastMonth = 0;
  incomes.forEach((d) => {
    const date = new Date(d.date);
    if (date >= thisMonthStart) thisMonth += d.amount;
    else if (date >= lastMonthStart) lastMonth += d.amount;
  });
  const avg = Math.round((thisMonth + lastMonth) / 2);
  const fmt = (n: number) => `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;

  const handleSave = async () => {
    if (!form.merchant || !form.amount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: form.merchant,
          date: form.date,
          amount: Number(form.amount),
          category: form.category,
          categoryIcon: CATEGORIES.find((c) => c.value === form.category)?.dot ? "💰" : "💰",
          direction: "income",
          paymentMethod: form.paymentMethod,
          note: form.note || undefined,
          source: "web",
          status: "confirmed",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const newEntry: IncomeEntry = {
          _id: json.data?.document?._id || `temp-${Date.now()}`,
          date: form.date,
          merchant: form.merchant,
          category: form.category,
          categoryIcon: "💰",
          amount: Number(form.amount),
          note: form.note,
          paymentMethod: form.paymentMethod,
          createdAt: new Date().toISOString(),
        };
        setIncomes((prev) => [newEntry, ...prev]);
        setIsAdding(false);
        setForm({ merchant: "", category: "เงินเดือน", date: new Date().toISOString().slice(0, 10), amount: "", note: "", paymentMethod: "transfer" });
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const columns: Column<IncomeEntry>[] = [
    {
      key: "merchant",
      label: "รายละเอียด",
      render: (r) => (
        <div className="leading-tight">
          <div className="font-medium">{r.merchant}</div>
          <div className={`text-[11px] ${muted}`}>{r.category}</div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "จำนวนเงิน",
      align: "right",
      render: (r) => <Baht value={r.amount} className="font-semibold text-green-500" />,
    },
    {
      key: "date",
      label: "วันที่",
      render: (r) => {
        const d = new Date(r.date);
        return (
          <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            {d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}
          </span>
        );
      },
    },
    { key: "note", label: "หมายเหตุ", defaultVisible: false },
  ];

  const inp = "w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50";
  const lbl = "block text-xs text-white/40 mb-1";

  return (
    <div className="space-y-6">
      {/* Add panel */}
      {isAdding && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsAdding(false)} />}
      {isAdding && (
        <div className="fixed inset-y-0 right-0 z-50 w-[440px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">เพิ่มรายรับ</h2>
              <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl">&times;</button>
            </div>
            <div><label className={lbl}>แหล่งที่มา / ชื่อ</label><input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="เช่น บริษัท ABC, ฟรีแลนซ์งาน X" className={inp} /></div>
            <div><label className={lbl}>จำนวนเงิน (฿)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inp} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>หมวดหมู่</label><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} /></div>
              <div><label className={lbl}>วันที่</label><DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
            </div>
            <div><label className={lbl}>วิธีรับเงิน</label><Select value={form.paymentMethod} onChange={(v) => setForm({ ...form, paymentMethod: v })} options={PAYMENT_METHODS} /></div>
            <div><label className={lbl}>หมายเหตุ</label><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="รายละเอียดเพิ่มเติม..." rows={2} className={`${inp} h-auto py-2`} /></div>
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button onClick={handleSave} disabled={saving || !form.merchant || !form.amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}เพิ่มรายรับ
              </button>
              <button onClick={() => setIsAdding(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="รายรับ" description="จัดการรายรับทั้งหมดของคุณ" />
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm">
          <Plus size={16} />เพิ่มรายรับ
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="รายรับเดือนนี้" value={fmt(thisMonth)} icon={<Wallet size={20} />} color="text-green-500" />
        <StatsCard label="เดือนที่แล้ว" value={fmt(lastMonth)} icon={<ArrowUpRight size={20} />} color="text-blue-500" />
        <StatsCard label="เฉลี่ย/เดือน" value={fmt(avg)} icon={<BarChart3 size={20} />} color="text-purple-500" />
      </div>
      <DataTable columns={columns} data={incomes} rowKey={(r) => r._id} dateField="date" />
    </div>
  );
}
