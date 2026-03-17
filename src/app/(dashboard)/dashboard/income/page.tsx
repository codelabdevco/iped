"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TrendingUp, Plus, Trash2, Wallet, ArrowUpRight, BarChart3 } from "lucide-react";

interface IncomeEntry {
  id: number; date: string; source: string; category: string; amount: number; note: string;
}

const INITIAL_DATA: IncomeEntry[] = [
  { id: 1, date: "2026-03-15", source: "บริษัท ABC จำกัด", category: "เงินเดือน", amount: 45000, note: "เงินเดือนมีนาคม" },
  { id: 2, date: "2026-03-12", source: "ลูกค้า Freelance", category: "ฟรีแลนซ์", amount: 12000, note: "ออกแบบเว็บไซต์" },
  { id: 3, date: "2026-03-10", source: "กองทุน LTF", category: "ลงทุน", amount: 3500, note: "ปันผลไตรมาส 1" },
  { id: 4, date: "2026-03-08", source: "ขายของออนไลน์", category: "อื่นๆ", amount: 5600, note: "ขายสินค้ามือสอง" },
  { id: 5, date: "2026-02-28", source: "บริษัท ABC จำกัด", category: "เงินเดือน", amount: 45000, note: "เงินเดือนกุมภาพันธ์" },
  { id: 6, date: "2026-02-20", source: "โปรเจกต์ App", category: "ฟรีแลนซ์", amount: 25000, note: "พัฒนาแอปมือถือ" },
  { id: 7, date: "2026-02-15", source: "หุ้น SET", category: "ลงทุน", amount: 8200, note: "กำไรจากการขายหุ้น" },
  { id: 8, date: "2026-02-05", source: "คืนภาษี", category: "อื่นๆ", amount: 6300, note: "คืนภาษีปี 2568" },
];

const catDark: Record<string, string> = { "เงินเดือน": "bg-blue-500/20 text-blue-400", "ฟรีแลนซ์": "bg-purple-500/20 text-purple-400", "ลงทุน": "bg-green-500/20 text-green-400", "อื่นๆ": "bg-orange-500/20 text-orange-400" };
const catLight: Record<string, string> = { "เงินเดือน": "bg-blue-100 text-blue-700", "ฟรีแลนซ์": "bg-purple-100 text-purple-700", "ลงทุน": "bg-green-100 text-green-700", "อื่นๆ": "bg-orange-100 text-orange-700" };

export default function IncomePage() {
  const { isDark } = useTheme();
  const [demoData, setDemoData] = useState(INITIAL_DATA);
  const clearDemo = () => setDemoData([]);
  const thisMonth = demoData.filter((d) => d.date.startsWith("2026-03")).reduce((s, d) => s + d.amount, 0);
  const lastMonth = demoData.filter((d) => d.date.startsWith("2026-02")).reduce((s, d) => s + d.amount, 0);
  const avg = demoData.length > 0 ? Math.round((thisMonth + lastMonth) / 2) : 0;
  const fmt = (n: number) => n.toLocaleString("th-TH", { style: "currency", currency: "THB" });
  const card = isDark ? "bg-[rgba(255,255,255,0.04)] border-white/10" : "bg-white border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-gray-400" : "text-gray-500";
  const cards = [
    { label: "รายรับเดือนนี้", value: thisMonth, icon: Wallet, color: "text-green-400" },
    { label: "เดือนที่แล้ว", value: lastMonth, icon: ArrowUpRight, color: "text-blue-400" },
    { label: "เฉลี่ย/เดือน", value: avg, icon: BarChart3, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-green-400" />
          <h1 className={`text-2xl font-bold ${txt}`}>รายรับ</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={clearDemo} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-50 text-red-600 hover:bg-red-100"}`}><Trash2 className="w-4 h-4" />ล้างข้อมูลตัวอย่าง</button>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-green-50 text-green-700 hover:bg-green-100"}`}><Plus className="w-4 h-4" />เพิ่มรายรับ</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center gap-3 mb-2">
              <c.icon className={`w-5 h-5 ${c.color}`} />
              <span className={`text-sm ${sub}`}>{c.label}</span>
            </div>
            <p className={`text-2xl font-bold ${txt}`}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>
      <div className={`rounded-2xl border overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDark ? "bg-white/5" : "bg-gray-50"}>
                {["วันที่", "แหล่งที่มา", "หมวดหมู่", "จำนวนเงิน", "หมายเหตุ"].map((h) => (
                  <th key={h} className={`px-5 py-3 text-left text-sm font-medium ${sub}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demoData.length === 0 ? (
                <tr><td colSpan={5} className={`px-5 py-10 text-center text-sm ${sub}`}>ไม่มีข้อมูล</td></tr>
              ) : demoData.map((row) => (
                <tr key={row.id} className={`border-t ${isDark ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50"} transition-colors`}>
                  <td className={`px-5 py-3 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{row.date}</td>
                  <td className={`px-5 py-3 text-sm font-medium ${txt}`}>{row.source}</td>
                  <td className="px-5 py-3"><span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? catDark[row.category] : catLight[row.category]}`}>{row.category}</span></td>
                  <td className="px-5 py-3 text-sm font-semibold text-green-500">+{fmt(row.amount)}</td>
                  <td className={`px-5 py-3 text-sm ${sub}`}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
