"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Globe, Trash2 } from "lucide-react";

const RATES = [
  { code: "THB", name: "บาท", flag: "🇹🇭", rate: 1, isDefault: true },
  { code: "USD", name: "ดอลลาร์สหรัฐ", flag: "🇺🇸", rate: 35.42 },
  { code: "EUR", name: "ยูโร", flag: "🇪🇺", rate: 38.15 },
  { code: "JPY", name: "เยน", flag: "🇯🇵", rate: 0.237 },
  { code: "CNY", name: "หยวน", flag: "🇨🇳", rate: 4.88 },
];

const INIT_TX = [
  { id: 1, date: "05/03/2569", desc: "Amazon.com", currency: "USD", amount: 49.99, thb: 1771 },
  { id: 2, date: "08/03/2569", desc: "Nintendo eShop Japan", currency: "JPY", amount: 7980, thb: 1891 },
  { id: 3, date: "10/03/2569", desc: "Booking.com (Paris)", currency: "EUR", amount: 125, thb: 4769 },
  { id: 4, date: "12/03/2569", desc: "AliExpress", currency: "CNY", amount: 299, thb: 1459 },
  { id: 5, date: "15/03/2569", desc: "Udemy Course", currency: "USD", amount: 12.99, thb: 460 },
];

export default function CurrencyPage() {
  const { isDark } = useTheme();
  const [txData, setTxData] = useState(INIT_TX);
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${txt}`}>สกุลเงิน</h1>
          <p className={`text-sm ${sub}`}>อัตราแลกเปลี่ยนและรายการต่างสกุลเงิน</p>
        </div>
        <button onClick={() => setTxData([])} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"} transition-colors`}><Trash2 size={16} />ล้างข้อมูลตัวอย่าง</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {RATES.map(r => (
          <div key={r.code} className={`${card} border ${border} rounded-2xl p-4 text-center`}>
            <div className="text-2xl mb-1">{r.flag}</div>
            <p className={`text-sm font-bold ${txt}`}>{r.code}</p>
            <p className={`text-xs ${sub}`}>{r.name}</p>
            <p className={`text-sm font-semibold mt-2 ${txt}`}>{r.isDefault ? "สกุลหลัก" : `฿${r.rate}`}</p>
          </div>
        ))}
      </div>
      <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
        <div className="p-5"><h3 className={`font-semibold ${txt}`}>รายการต่างสกุลเงิน</h3></div>
        <table className="w-full">
          <thead><tr className={`text-left text-xs font-semibold ${sub} ${isDark ? "bg-white/3" : "bg-gray-50"}`}>
            <th className="px-5 py-3">วันที่</th><th className="px-5 py-3">รายการ</th><th className="px-5 py-3">สกุลเงิน</th><th className="px-5 py-3 text-right">จำนวนเงิน</th><th className="px-5 py-3 text-right">เทียบ THB</th>
          </tr></thead>
          <tbody>{txData.length === 0 ? <tr><td colSpan={5} className={`px-5 py-12 text-center ${sub}`}>ไม่มีข้อมูล</td></tr> : txData.map(r => (
            <tr key={r.id} className={`border-t ${border} ${isDark ? "hover:bg-white/3" : "hover:bg-gray-50"} transition-colors`}>
              <td className={`px-5 py-3 text-sm ${sub}`}>{r.date}</td>
              <td className={`px-5 py-3 text-sm font-medium ${txt}`}>{r.desc}</td>
              <td className={`px-5 py-3 text-sm font-medium ${txt}`}>{r.currency}</td>
              <td className={`px-5 py-3 text-sm text-right ${txt}`}>{r.amount.toLocaleString()}</td>
              <td className="px-5 py-3 text-sm text-right font-semibold text-red-500">-฿{r.thb.toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
