"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Repeat, Plus, Trash2 } from "lucide-react";

const INIT = [
  { id: 1, name: "เงินเดือน", type: "income", amount: 45000, cycle: "รายเดือน", next: "01/04/2569", active: true },
  { id: 2, name: "ค่าเช่าคอนโด", type: "expense", amount: 12000, cycle: "รายเดือน", next: "01/04/2569", active: true },
  { id: 3, name: "ค่าอินเทอร์เน็ต AIS Fibre", type: "expense", amount: 599, cycle: "รายเดือน", next: "15/04/2569", active: true },
  { id: 4, name: "Netflix Premium", type: "expense", amount: 419, cycle: "รายเดือน", next: "20/04/2569", active: true },
  { id: 5, name: "ประกันชีวิต AIA", type: "expense", amount: 18000, cycle: "รายปี", next: "15/08/2569", active: true },
  { id: 6, name: "ค่าโทรศัพท์ TRUE", type: "expense", amount: 799, cycle: "รายเดือน", next: "25/04/2569", active: false },
];

export default function RecurringPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className={`text-2xl font-bold ${txt}`}>รายการประจำ</h1><p className={`text-sm ${sub}`}>รายรับ-รายจ่ายที่เกิดขึ้นเป็นประจำ</p></div>
        <div className="flex gap-2">
          <button onClick={() => setData([])} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"} transition-colors`}><Trash2 size={16} />ล้างข้อมูลตัวอย่าง</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors"><Plus size={16} />เพิ่มรายการ</button>
        </div>
      </div>
      <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
        <table className="w-full">
          <thead><tr className={`text-left text-xs font-semibold ${sub} ${isDark ? "bg-white/3" : "bg-gray-50"}`}>
            <th className="px-5 py-3">ชื่อรายการ</th><th className="px-5 py-3">ประเภท</th><th className="px-5 py-3 text-right">จำนวนเงิน</th><th className="px-5 py-3">รอบ</th><th className="px-5 py-3">วันถัดไป</th><th className="px-5 py-3">สถานะ</th>
          </tr></thead>
          <tbody>{data.length === 0 ? <tr><td colSpan={6} className={`px-5 py-12 text-center ${sub}`}>ไม่มีข้อมูล</td></tr> : data.map(r => (
            <tr key={r.id} className={`border-t ${border} ${isDark ? "hover:bg-white/3" : "hover:bg-gray-50"} transition-colors`}>
              <td className={`px-5 py-3 text-sm font-medium ${txt}`}>{r.name}</td>
              <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${r.type === "income" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{r.type === "income" ? "รายรับ" : "รายจ่าย"}</span></td>
              <td className={`px-5 py-3 text-sm font-semibold text-right ${r.type === "income" ? "text-green-500" : "text-red-500"}`}>{r.type === "income" ? "+" : "-"}฿{r.amount.toLocaleString()}</td>
              <td className={`px-5 py-3 text-sm ${sub}`}>{r.cycle}</td>
              <td className={`px-5 py-3 text-sm ${sub}`}>{r.next}</td>
              <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${r.active ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>{r.active ? "ใช้งาน" : "หยุดชั่วคราว"}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
