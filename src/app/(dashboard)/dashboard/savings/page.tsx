"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { PiggyBank, Plus, Trash2, Target, Wallet, Loader2, X, Pencil } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  color: string;
}

const COLORS = ["#818CF8", "#FB923C", "#34D399", "#60A5FA", "#F472B6", "#FBBF24", "#A78BFA", "#F87171"];

function Baht({ value, className = "" }: { value: number; className?: string }) {
  const whole = Math.floor(Math.abs(value)).toLocaleString();
  const dec = (Math.abs(value) % 1).toFixed(2).slice(1);
  return <span className={className}>฿{whole}<span className="text-[0.75em] opacity-50">{dec}</span></span>;
}

export default function SavingsPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState<SavingsGoal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", target: "", current: "", deadline: "", color: COLORS[0] });

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("iped-savings");
      if (saved) setData(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (loaded) localStorage.setItem("iped-savings", JSON.stringify(data));
  }, [data, loaded]);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const totalSaved = data.reduce((s, d) => s + d.current, 0);
  const totalTarget = data.reduce((s, d) => s + d.target, 0);
  const done = data.filter((d) => d.current >= d.target).length;

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", target: "", current: "0", deadline: "", color: COLORS[data.length % COLORS.length] });
    setIsAdding(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditingId(g.id);
    setForm({ name: g.name, target: String(g.target), current: String(g.current), deadline: g.deadline, color: g.color });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!form.name || !form.target) return;
    if (editingId) {
      setData((prev) => prev.map((g) => g.id === editingId ? { ...g, name: form.name, target: Number(form.target), current: Number(form.current), deadline: form.deadline, color: form.color } : g));
    } else {
      setData((prev) => [...prev, { id: `sg-${Date.now()}`, name: form.name, target: Number(form.target), current: Number(form.current || 0), deadline: form.deadline, color: form.color }]);
    }
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("ลบเป้าหมายนี้?")) setData((prev) => prev.filter((g) => g.id !== id));
  };

  const addAmount = (id: string, amount: number) => {
    const input = prompt("จำนวนเงินที่ออมเพิ่ม (฿)");
    if (!input) return;
    const val = Number(input);
    if (isNaN(val) || val <= 0) return;
    setData((prev) => prev.map((g) => g.id === id ? { ...g, current: g.current + val } : g));
  };

  const inp = "w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50";
  const lbl = "block text-xs text-white/40 mb-1";

  return (
    <div className="space-y-6">
      {/* Add/Edit panel */}
      {isAdding && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsAdding(false)} />}
      {isAdding && (
        <div className="fixed inset-y-0 right-0 z-50 w-[440px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingId ? "แก้ไขเป้าหมาย" : "เพิ่มเป้าหมาย"}</h2>
              <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl">&times;</button>
            </div>
            <div><label className={lbl}>ชื่อเป้าหมาย</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น ท่องเที่ยวญี่ปุ่น" className={inp} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>เป้าหมาย (฿)</label><input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="50,000" className={inp} /></div>
              <div><label className={lbl}>ออมแล้ว (฿)</label><input type="number" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} placeholder="0" className={inp} /></div>
            </div>
            <div><label className={lbl}>ครบกำหนด</label><input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="30/09/2569" className={inp} /></div>
            <div>
              <label className={lbl}>สี</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110" : "hover:scale-105"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button onClick={handleSave} disabled={!form.name || !form.target} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-40">
                {editingId ? "บันทึก" : "เพิ่มเป้าหมาย"}
              </button>
              <button onClick={() => setIsAdding(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="เงินออม" description="เป้าหมายการออมเงินของคุณ" />
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm">
          <Plus size={16} />เพิ่มเป้าหมาย
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="ออมแล้วทั้งหมด" value={`฿${totalSaved.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<PiggyBank size={20} />} color="text-green-500" />
        <StatsCard label="สำเร็จ" value={`${done} / ${data.length} เป้าหมาย`} icon={<Target size={20} />} color="text-blue-500" />
        <StatsCard label="เหลืออีก" value={`฿${Math.max(0, totalTarget - totalSaved).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Wallet size={20} />} color="text-purple-500" />
      </div>

      {data.length === 0 ? (
        <div className={`${card} border ${border} rounded-2xl p-12 text-center ${sub}`}>
          ยังไม่มีเป้าหมาย — กดเพิ่มเป้าหมายเพื่อเริ่มต้น
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((g) => {
            const pct = Math.min((g.current / g.target) * 100, 100);
            const remaining = Math.max(0, g.target - g.current);
            return (
              <div key={g.id} className={`${card} border ${border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${txt}`}>{g.name}</h3>
                  <div className="flex items-center gap-1">
                    {g.deadline && <span className={`text-xs ${sub} mr-2`}>{g.deadline}</span>}
                    <button onClick={() => openEdit(g)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/30 hover:text-white/60" : "hover:bg-gray-100 text-gray-400"}`}><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(g.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/30 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <Baht value={g.current} className={`text-2xl font-bold ${txt}`} />
                  <span className={`text-sm ${sub}`}>/ <Baht value={g.target} className="" /></span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button onClick={() => addAmount(g.id, 0)} className="text-xs font-medium px-2 py-1 rounded-lg transition-colors" style={{ color: g.color, backgroundColor: g.color + "15" }}>
                    + เพิ่มเงินออม
                  </button>
                  <span className="text-xs font-medium" style={{ color: g.color }}>{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
