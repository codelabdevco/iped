"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, ShieldCheck, Check, X, Clock } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

const initData = [
  { id: 1, requester: "นภา ศรีสุข", item: "ค่าเดินทางไปพบลูกค้า จ.ชลบุรี", amount: 4500, category: "ค่าเดินทาง", date: "2026-03-15", status: "รออนุมัติ" },
  { id: 2, requester: "ธนกร เจริญยิ่ง", item: "อุปกรณ์เซิร์ฟเวอร์ Dell PowerEdge", amount: 185000, category: "อุปกรณ์ IT", date: "2026-03-14", status: "รออนุมัติ" },
  { id: 3, requester: "กิตติพงษ์ อมรรัตน์", item: "ต่ออายุ License Microsoft 365", amount: 45000, category: "ซอฟต์แวร์", date: "2026-03-13", status: "อนุมัติ" },
  { id: 4, requester: "พิมพ์ชนก รัตนกุล", item: "เครื่องเขียนและอุปกรณ์สำนักงาน", amount: 3200, category: "สำนักงาน", date: "2026-03-12", status: "อนุมัติ" },
  { id: 5, requester: "วิชัย พงศ์ประเสริฐ", item: "ค่าจ้างผู้รับเหมาซ่อมแอร์", amount: 28000, category: "ซ่อมบำรุง", date: "2026-03-11", status: "ปฏิเสธ" },
  { id: 6, requester: "อรุณี มงคลชัย", item: "ค่าอบรมพนักงานใหม่", amount: 15000, category: "ฝึกอบรม", date: "2026-03-10", status: "อนุมัติ" },
  { id: 7, requester: "สุภาพร แสงทอง", item: "ค่าสอบบัญชีประจำปี", amount: 65000, category: "ค่าบริการ", date: "2026-03-16", status: "รออนุมัติ" },
  { id: 8, requester: "นภา ศรีสุข", item: "ค่าโฆษณา Facebook Ads", amount: 12000, category: "การตลาด", date: "2026-03-09", status: "ปฏิเสธ" },
];

const statusStyle: Record<string, string> = { "รออนุมัติ": "bg-yellow-500/20 text-yellow-400", "อนุมัติ": "bg-green-500/20 text-green-400", "ปฏิเสธ": "bg-red-500/20 text-red-400" };

export default function Page() {
  const { isDark } = useTheme();
  const [data, setData] = useState(initData);
  const pending = data.filter(d => d.status === "รออนุมัติ").length;
  const approved = data.filter(d => d.status === "อนุมัติ").length;
  const rejected = data.filter(d => d.status === "ปฏิเสธ").length;
  const c = (d: string, l: string) => isDark ? d : l;

  const handleAction = (id: number, action: string) => {
    setData(prev => prev.map(d => d.id === id ? { ...d, status: action } : d));
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="อนุมัติรายจ่าย" description="จัดการ workflow อนุมัติรายจ่าย" onClear={() => setData([])} />

      <div className="grid grid-cols-3 gap-4">
        {[["รออนุมัติ", pending + " รายการ"], ["อนุมัติแล้ว", approved + " รายการ"], ["ปฏิเสธ", rejected + " รายการ"]].map(([label, val]) => (
          <div key={label} className={`p-4 rounded-xl border ${c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
            <p className={`text-sm ${c("text-white/50", "text-gray-500")}`}>{label}</p>
            <p className={`text-xl font-bold mt-1 ${c("text-white", "text-gray-900")}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border overflow-hidden ${c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
        <table className="w-full text-sm">
          <thead><tr className={c("border-b border-[rgba(255,255,255,0.06)]", "border-b border-gray-200")}>
            {["ผู้ขอ", "รายการ", "จำนวนเงิน", "หมวดหมู่", "วันที่ขอ", "สถานะ", "จัดการ"].map(h => (
              <th key={h} className={`px-4 py-3 text-left font-medium ${c("text-white/50", "text-gray-500")}`}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map(r => (
              <tr key={r.id} className={`border-t ${c("border-[rgba(255,255,255,0.06)] hover:bg-white/5", "border-gray-100 hover:bg-gray-50")}`}>
                <td className={`px-4 py-3 font-medium ${c("text-white", "text-gray-900")}`}>{r.requester}</td>
                <td className={`px-4 py-3 ${c("text-white/50", "text-gray-500")}`}>{r.item}</td>
                <td className={`px-4 py-3 font-medium ${c("text-white", "text-gray-900")}`}>฿{r.amount.toLocaleString()}</td>
                <td className={`px-4 py-3 ${c("text-white/50", "text-gray-500")}`}>{r.category}</td>
                <td className={`px-4 py-3 ${c("text-white/50", "text-gray-500")}`}>{r.date}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusStyle[r.status]}`}>{r.status}</span></td>
                <td className="px-4 py-3">
                  {r.status === "รออนุมัติ" ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleAction(r.id, "อนุมัติ")} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleAction(r.id, "ปฏิเสธ")} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>-</span>}
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className={`px-4 py-12 text-center ${c("text-white/50", "text-gray-500")}`}><Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
