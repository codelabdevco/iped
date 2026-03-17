"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { PiggyBank, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

const INIT = [
  { id: 1, name: "ท่องเที่ยวญี่ปุ่น", target: 50000, current: 32000, deadline: "30/09/2569", color: "#818CF8" },
  { id: 2, name: "ซื้อ MacBook Pro", target: 65000, current: 48500, deadline: "31/12/2569", color: "#FB923C" },
  { id: 3, name: "กองทุนฉุกเฉิน", target: 100000, current: 67000, deadline: "30/06/2570", color: "#34D399" },
  { id: 4, name: "ดาวน์รถยนต์", target: 200000, current: 85000, deadline: "31/12/2570", color: "#60A5FA" },
];

export default function SavingsPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const totalSaved = data.reduce((s, d) => s + d.current, 0);
  const done = data.filter(d => d.current >= d.target).length;

  return (
    <div className="space-y-6">
      <PageHeader title="เงินออม" description="เป้าหมายการออมเงินของคุณ" onClear={() => setData([])} actionLabel="เพิ่มเป้าหมาย" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: "เงินออมทั้งหมด", value: `฿${totalSaved.toLocaleString()}` }, { label: "เป้าหมายที่สำเร็จ", value: `${done} / ${data.length}` }, { label: "ออมเดือนนี้", value: "฿12,500" }].map((s, i) => (
          <div key={i} className={`${card} border ${border} rounded-2xl p-5`}><p className={`text-sm ${sub}`}>{s.label}</p><p className={`text-2xl font-bold mt-1 ${txt}`}>{s.value}</p></div>
        ))}
      </div>
      {data.length === 0 ? <div className={`${card} border ${border} rounded-2xl p-12 text-center ${sub}`}>ไม่มีข้อมูล</div> :
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map(g => {
          const pct = Math.min((g.current / g.target) * 100, 100);
          return (
            <div key={g.id} className={`${card} border ${border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${txt}`}>{g.name}</h3>
                <span className={`text-xs ${sub}`}>ครบกำหนด {g.deadline}</span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className={`text-2xl font-bold ${txt}`}>฿{g.current.toLocaleString()}</span>
                <span className={`text-sm ${sub}`}>/ ฿{g.target.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: g.color }} />
              </div>
              <p className={`text-xs mt-2 text-right font-medium`} style={{ color: g.color }}>{pct.toFixed(0)}%</p>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
