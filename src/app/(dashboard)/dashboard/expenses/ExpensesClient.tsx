"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { TrendingDown, Hash, Calculator, Plus, Loader2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";

interface ExpenseEntry {
  _id: string;
  date: string;
  merchant: string;
  category: string;
  categoryIcon: string;
  amount: number;
  paymentMethod?: string;
  status: string;
  createdAt?: string;
}

const CATEGORIES = [
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
  { value: "transfer", label: "โอนธนาคาร" },
  { value: "credit", label: "บัตรเครดิต" },
  { value: "debit", label: "บัตรเดบิต" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "other", label: "อื่นๆ" },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "ยืนยัน", cls: "bg-green-500/10 text-green-400" },
  pending: { label: "รอตรวจ", cls: "bg-yellow-500/10 text-yellow-400" },
  edited: { label: "แก้ไข", cls: "bg-blue-500/10 text-blue-400" },
  cancelled: { label: "ยกเลิก", cls: "bg-red-500/10 text-red-400" },
};

function Baht({ value, className = "" }: { value: number; className?: string }) {
  const whole = Math.floor(Math.abs(value)).toLocaleString();
  const dec = (Math.abs(value) % 1).toFixed(2).slice(1);
  return <span className={className}>{value < 0 ? "-" : ""}฿{whole}<span className="text-[0.75em] opacity-50">{dec}</span></span>;
}

interface Props {
  expenses: ExpenseEntry[];
  stats: { totalAmount: number; count: number };
}

export default function ExpensesClient({ expenses: initial, stats: initStats }: Props) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [expenses, setExpenses] = useState(initial);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ merchant: "", category: "อาหาร", date: new Date().toISOString().slice(0, 10), amount: "", note: "", paymentMethod: "cash" });

  const muted = isDark ? "text-white/30" : "text-gray-400";

  // Stats from local state
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const count = expenses.length;
  const avg = count > 0 ? Math.round(totalAmount / count) : 0;

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
          categoryIcon: "📋",
          direction: "expense",
          paymentMethod: form.paymentMethod,
          note: form.note || undefined,
          source: "web",
          status: "confirmed",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const newEntry: ExpenseEntry = {
          _id: json.data?.document?._id || `temp-${Date.now()}`,
          date: form.date,
          merchant: form.merchant,
          category: form.category,
          categoryIcon: "📋",
          amount: Number(form.amount),
          paymentMethod: form.paymentMethod,
          status: "confirmed",
          createdAt: new Date().toISOString(),
        };
        setExpenses((prev) => [newEntry, ...prev]);
        setIsAdding(false);
        setForm({ merchant: "", category: "อาหาร", date: new Date().toISOString().slice(0, 10), amount: "", note: "", paymentMethod: "cash" });
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const columns: Column<ExpenseEntry>[] = [
    {
      key: "merchant",
      label: "รายละเอียด",
      render: (r) => (
        <div className="leading-tight">
          <div className="font-medium">{r.categoryIcon} {r.merchant}</div>
          <div className={`text-[11px] ${muted}`}>{r.category}</div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "จำนวนเงิน",
      align: "right",
      render: (r) => <Baht value={r.amount} className="font-semibold text-red-500" />,
    },
    {
      key: "date",
      label: "วันที่",
      render: (r) => new Date(r.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short" }),
    },
    {
      key: "paymentMethod",
      label: "วิธีจ่าย",
      defaultVisible: false,
      render: (r) => PAYMENT_METHODS.find((p) => p.value === r.paymentMethod)?.label || r.paymentMethod || "-",
    },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => {
        const st = statusMap[r.status] || statusMap.pending;
        return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span>;
      },
    },
  ];

  const inp = "w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50";
  const lbl = "block text-xs text-white/40 mb-1";

  return (
    <div className="space-y-6">
      {isAdding && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsAdding(false)} />}
      {isAdding && (
        <div className="fixed inset-y-0 right-0 z-50 w-[440px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">เพิ่มรายจ่าย</h2>
              <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl">&times;</button>
            </div>
            <div><label className={lbl}>ร้านค้า / รายการ</label><input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="เช่น 7-Eleven, Grab Food" className={inp} /></div>
            <div><label className={lbl}>จำนวนเงิน (฿)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inp} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>หมวดหมู่</label><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} /></div>
              <div><label className={lbl}>วันที่</label><DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
            </div>
            <div><label className={lbl}>วิธีจ่าย</label><Select value={form.paymentMethod} onChange={(v) => setForm({ ...form, paymentMethod: v })} options={PAYMENT_METHODS} /></div>
            <div><label className={lbl}>หมายเหตุ</label><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="รายละเอียดเพิ่มเติม..." rows={2} className={`${inp} h-auto py-2`} /></div>
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button onClick={handleSave} disabled={saving || !form.merchant || !form.amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}เพิ่มรายจ่าย
              </button>
              <button onClick={() => setIsAdding(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="รายจ่าย" description="จัดการรายจ่ายทั้งหมดของคุณ" />
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25">
          <Plus size={16} />เพิ่มรายจ่าย
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="รายจ่ายทั้งหมด" value={`฿${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<TrendingDown size={20} />} color="text-red-500" />
        <StatsCard label="จำนวนรายการ" value={`${count} รายการ`} icon={<Hash size={20} />} color="text-blue-500" />
        <StatsCard label="เฉลี่ย/รายการ" value={`฿${avg.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Calculator size={20} />} color="text-purple-500" />
      </div>
      <DataTable columns={columns} data={expenses} rowKey={(r) => r._id} dateField="date" />
    </div>
  );
}
