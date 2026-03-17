"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TrendingDown, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

const INIT = [
  { id: 1, date: "01/03/2569", store: "Tops Market สาขาสีลม", category: "อาหาร", amount: 1250, payment: "พร้อมเพย์", status: "confirmed" },
  { id: 2, date: "02/03/2569", store: "BTS สายสีเขียว", category: "เดินทาง", amount: 350, payment: "Rabbit Card", status: "confirmed" },
  { id: 3, date: "03/03/2569", store: "Uniqlo เซ็นทรัลเวิลด์", category: "ช็อปปิ้ง", amount: 2490, payment: "บัตร SCB Visa", status: "confirmed" },
  { id: 4, date: "05/03/2569", store: "ค่าไฟฟ้า MEA", category: "สาธารณูปโภค", amount: 1850, payment: "โอนธนาคาร", status: "confirmed" },
  { id: 5, date: "07/03/2569", store: "โรงพยาบาลบำรุงราษฎร์", category: "สุขภาพ", amount: 3500, payment: "บัตร SCB Visa", status: "pending" },
  { id: 6, date: "08/03/2569", store: "Grab Food", category: "อาหาร", amount: 285, payment: "พร้อมเพย์", status: "confirmed" },
  { id: 7, date: "10/03/2569", store: "Shell ปั๊มน้ำมัน", category: "เดินทาง", amount: 1500, payment: "บัตรเดบิต KBank", status: "confirmed" },
  { id: 8, date: "12/03/2569", store: "7-Eleven", category: "อาหาร", amount: 175, payment: "เงินสด", status: "confirmed" },
  { id: 9, date: "14/03/2569", store: "ค่าน้ำประปา MWA", category: "สาธารณูปโภค", amount: 320, payment: "พร้อมเพย์", status: "confirmed" },
  { id: 10, date: "15/03/2569", store: "Watsons สยามสแควร์", category: "สุขภาพ", amount: 890, payment: "เงินสด", status: "pending" },
];

const catColors: Record<string, string> = { "อาหาร": "bg-orange-500/10 text-orange-400", "เดินทาง": "bg-blue-500/10 text-blue-400", "ช็อปปิ้ง": "bg-purple-500/10 text-purple-400", "สาธารณูปโภค": "bg-pink-500/10 text-pink-400", "สุขภาพ": "bg-green-500/10 text-green-400" };
const statusMap: Record<string, { label: string; cls: string }> = { confirmed: { label: "ยืนยันแล้ว", cls: "bg-green-500/10 text-green-400" }, pending: { label: "รอตรวจสอบ", cls: "bg-yellow-500/10 text-yellow-400" } };

export default function ExpensesPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="รายจ่าย" description="จัดการรายจ่ายทั้งหมดของคุณ" onClear={() => setData([])} actionLabel="เพิ่มรายจ่าย" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: "รายจ่ายเดือนนี้", value: `฿${total.toLocaleString()}` }, { label: "จำนวนรายการ", value: `${data.length} รายการ` }, { label: "เฉลี่ย/รายการ", value: `฿${data.length > 0 ? Math.round(total / data.length).toLocaleString() : 0}` }].map((s, i) => (
          <div key={i} className={`${card} border ${border} rounded-2xl p-5`}><p className={`text-sm ${sub}`}>{s.label}</p><p className={`text-2xl font-bold mt-1 ${txt}`}>{s.value}</p></div>
        ))}
      </div>
      <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
        <table className="w-full">
          <thead><tr className={`text-left text-xs font-semibold ${sub} ${isDark ? "bg-white/3" : "bg-gray-50"}`}>
            <th className="px-5 py-3">วันที่</th><th className="px-5 py-3">ร้านค้า</th><th className="px-5 py-3">หมวดหมู่</th><th className="px-5 py-3 text-right">จำนวนเงิน</th><th className="px-5 py-3">วิธีจ่าย</th><th className="px-5 py-3">สถานะ</th>
          </tr></thead>
          <tbody>{data.length === 0 ? <tr><td colSpan={6} className={`px-5 py-12 text-center ${sub}`}>ไม่มีข้อมูล</td></tr> : data.map(r => {
            const st = statusMap[r.status] || statusMap.pending;
            return (
            <tr key={r.id} className={`border-t ${border} ${isDark ? "hover:bg-white/3" : "hover:bg-gray-50"} transition-colors`}>
              <td className={`px-5 py-3 text-sm ${sub}`}>{r.date}</td>
              <td className={`px-5 py-3 text-sm font-medium ${txt}`}>{r.store}</td>
              <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${catColors[r.category] || "bg-gray-500/10 text-gray-400"}`}>{r.category}</span></td>
              <td className="px-5 py-3 text-sm font-semibold text-right text-red-500">-฿{r.amount.toLocaleString()}</td>
              <td className={`px-5 py-3 text-sm ${sub}`}>{r.payment}</td>
              <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
