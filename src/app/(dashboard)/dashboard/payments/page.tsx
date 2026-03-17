"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { CreditCard, Plus, Trash2, Banknote, Smartphone, Building2 } from "lucide-react";

const INIT = [
  { id: 1, name: "เงินสด", type: "เงินสด", spent: 4250, icon: "cash", color: "#34D399" },
  { id: 2, name: "บัตร SCB Visa Platinum", type: "บัตรเครดิต", spent: 15800, icon: "credit", color: "#818CF8" },
  { id: 3, name: "บัตรเดบิต KBank", type: "บัตรเดบิต", spent: 3200, icon: "debit", color: "#60A5FA" },
  { id: 4, name: "พร้อมเพย์", type: "พร้อมเพย์", spent: 8900, icon: "promptpay", color: "#FB923C" },
  { id: 5, name: "โอน BBL", type: "โอนธนาคาร", spent: 12000, icon: "transfer", color: "#F472B6" },
];

export default function PaymentsPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const total = data.reduce((s, d) => s + d.spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className={`text-2xl font-bold ${txt}`}>วิธีจ่าย</h1><p className={`text-sm ${sub}`}>จัดการช่องทางการชำระเงิน</p></div>
        <div className="flex gap-2">
          <button onClick={() => setData([])} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"} transition-colors`}><Trash2 size={16} />ล้างข้อมูลตัวอย่าง</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors"><Plus size={16} />เพิ่มวิธีจ่าย</button>
        </div>
      </div>
      {data.length === 0 ? <div className={`${card} border ${border} rounded-2xl p-12 text-center ${sub}`}>ไม่มีข้อมูล</div> :
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(m => {
          const pct = total > 0 ? (m.spent / total) * 100 : 0;
          return (
            <div key={m.id} className={`${card} border ${border} rounded-2xl p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.color + "20" }}>
                  <CreditCard size={20} style={{ color: m.color }} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${txt}`}>{m.name}</p>
                  <p className={`text-xs ${sub}`}>{m.type}</p>
                </div>
              </div>
              <p className={`text-xl font-bold ${txt}`}>฿{m.spent.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: m.color }} />
                </div>
                <span className={`text-xs font-medium ${sub}`}>{pct.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
