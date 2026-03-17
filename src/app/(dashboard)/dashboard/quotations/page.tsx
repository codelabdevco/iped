"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, FileText, Plus, Clock } from "lucide-react";

const initData = [
  { id: "QT-2026-001", customer: "บจก. สยามเทค โซลูชั่นส์", item: "ระบบ ERP License x10", amount: 450000, date: "2026-03-01", expires: "2026-03-31", status: "ส่งแล้ว" },
  { id: "QT-2026-002", customer: "บจก. กรุงเทพ อินโนเวชั่น", item: "บริการติดตั้งระบบเครือข่าย", amount: 185000, date: "2026-03-05", expires: "2026-04-04", status: "อนุมัติ" },
  { id: "QT-2026-003", customer: "หจก. พัฒนาซอฟต์", item: "พัฒนาเว็บแอปพลิเคชัน", amount: 320000, date: "2026-03-08", expires: "2026-04-07", status: "ร่าง" },
  { id: "QT-2026-004", customer: "บจก. ไทยดิจิทัล มีเดีย", item: "ออกแบบ UI/UX ระบบ CRM", amount: 95000, date: "2026-03-10", expires: "2026-04-09", status: "ปฏิเสธ" },
  { id: "QT-2026-005", customer: "บจก. อีสเทิร์น โลจิสติกส์", item: "ระบบจัดการคลังสินค้า", amount: 520000, date: "2026-03-12", expires: "2026-04-11", status: "ส่งแล้ว" },
  { id: "QT-2026-006", customer: "บจก. นอร์ทสตาร์ เอ็นจิเนียริ่ง", item: "ระบบ IoT Monitoring", amount: 275000, date: "2026-02-15", expires: "2026-03-15", status: "หมดอายุ" },
];

const statusColor: Record<string, string> = { "ร่าง": "bg-gray-500/20 text-gray-400", "ส่งแล้ว": "bg-blue-500/20 text-blue-400", "อนุมัติ": "bg-green-500/20 text-green-400", "ปฏิเสธ": "bg-red-500/20 text-red-400", "หมดอายุ": "bg-yellow-500/20 text-yellow-400" };

export default function Page() {
  const { isDark } = useTheme();
  const [data, setData] = useState(initData);
  const pending = data.filter(d => d.status === "ส่งแล้ว").length;
  const total = data.reduce((s, d) => s + d.amount, 0);
  const c = (d: string, l: string) => isDark ? d : l;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${c("text-white", "text-gray-900")}`}><FileText className="inline mr-2 w-6 h-6" />ใบเสนอราคา</h1>
        <div className="flex gap-2">
          {data.length > 0 && <button onClick={() => setData([])} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30"><Trash2 className="w-4 h-4" />ล้างข้อมูลตัวอย่าง</button>}
          <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"><Plus className="w-4 h-4" />สร้างใบเสนอราคา</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[["ทั้งหมด", data.length + " รายการ"], ["รออนุมัติ", pending + " รายการ"], ["มูลค่ารวม", "฿" + total.toLocaleString()]].map(([label, val]) => (
          <div key={label} className={`p-4 rounded-xl border ${c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
            <p className={`text-sm ${c("text-white/50", "text-gray-500")}`}>{label}</p>
            <p className={`text-xl font-bold mt-1 ${c("text-white", "text-gray-900")}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border overflow-hidden ${c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
        <table className="w-full text-sm">
          <thead><tr className={c("border-b border-[rgba(255,255,255,0.06)]", "border-b border-gray-200")}>
            {["เลขที่", "ลูกค้า", "รายการ", "จำนวนเงิน", "วันที่", "หมดอายุ", "สถานะ"].map(h => (
              <th key={h} className={`px-4 py-3 text-left font-medium ${c("text-white/50", "text-gray-500")}`}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map(r => (
              <tr key={r.id} className={`border-t ${c("border-[rgba(255,255,255,0.06)] hover:bg-white/5", "border-gray-100 hover:bg-gray-50")}`}>
                <td className={`px-4 py-3 font-mono ${c("text-white", "text-gray-900")}`}>{r.id}</td>
                <td className={`px-4 py-3 ${c("text-white", "text-gray-900")}`}>{r.customer}</td>
                <td className={`px-4 py-3 ${c("text-white/50", "text-gray-500")}`}>{r.item}</td>
                <td className={`px-4 py-3 font-medium ${c("text-white", "text-gray-900")}`}>฿{r.amount.toLocaleString()}</td>
                <td className={`px-4 py-3 ${c("text-white/50", "text-gray-500")}`}>{r.date}</td>
                <td className={`px-4 py-3 ${c("text-white/50", "text-gray-500")}`}>{r.expires}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColor[r.status]}`}>{r.status}</span></td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className={`px-4 py-12 text-center ${c("text-white/50", "text-gray-500")}`}><Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
