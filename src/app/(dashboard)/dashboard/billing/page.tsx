"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, CreditCard, Check, Star, Zap } from "lucide-react";

const initPlans = [
  { id: 1, name: "Free", price: 0, features: ["ใบเสร็จ 50 ใบ/เดือน", "OCR พื้นฐาน", "รายงานสรุป", "ผู้ใช้ 1 คน"], current: false },
  { id: 2, name: "Pro", price: 299, features: ["ใบเสร็จ 500 ใบ/เดือน", "OCR + AI วิเคราะห์", "รายงานภาษี", "ผู้ใช้ 5 คน", "เชื่อมบัญชี"], current: true },
  { id: 3, name: "Business", price: 899, features: ["ใบเสร็จไม่จำกัด", "OCR + AI ขั้นสูง", "รายงานทุกประเภท", "ผู้ใช้ไม่จำกัด", "เชื่อมบัญชี", "API Access", "Priority Support"], current: false },
];
const initInvoices = [
  { id: 1, date: "2026-03-01", desc: "Pro Plan - มีนาคม 2026", amount: 299, status: "ชำระแล้ว" },
  { id: 2, date: "2026-02-01", desc: "Pro Plan - กุมภาพันธ์ 2026", amount: 299, status: "ชำระแล้ว" },
  { id: 3, date: "2026-01-01", desc: "Pro Plan - มกราคม 2026", amount: 299, status: "ชำระแล้ว" },
  { id: 4, date: "2025-12-01", desc: "Pro Plan - ธันวาคม 2025", amount: 299, status: "ชำระแล้ว" },
  { id: 5, date: "2025-11-01", desc: "Pro Plan - พฤศจิกายน 2025", amount: 299, status: "ชำระแล้ว" },
];

export default function Page() {
  const { isDark } = useTheme();
  const [plans, setPlans] = useState(initPlans);
  const [invoices, setInvoices] = useState(initInvoices);
  const card = `rounded-xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const clearDemo = () => { setPlans([]); setInvoices([]); };

  return (
    <div className={`p-6 space-y-6 ${txt}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">แพ็กเกจและการชำระเงิน</h1>
        <button onClick={clearDemo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm">
          <Trash2 size={16} /> ล้างข้อมูลตัวอย่าง
        </button>
      </div>

      <div className={`${card} flex items-center gap-4`}>
        <div className="p-3 rounded-xl bg-blue-500/10"><Star size={24} className="text-blue-400" /></div>
        <div>
          <p className={sub}>แพ็กเกจปัจจุบัน</p>
          <p className="text-xl font-bold">Pro Plan — ฿299/เดือน</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className={`${card} ${p.current ? "ring-2 ring-blue-500" : ""}`}>
            <h3 className="text-lg font-bold mb-1">{p.name}</h3>
            <p className="text-2xl font-bold mb-4">฿{p.price.toLocaleString()}<span className={`text-sm font-normal ${sub}`}>/เดือน</span></p>
            <ul className="space-y-2 mb-4">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm"><Check size={14} className="text-green-400 shrink-0" />{f}</li>
              ))}
            </ul>
            <button className={`w-full py-2 rounded-lg text-sm font-medium ${p.current ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"}`}>
              {p.current ? "แพ็กเกจปัจจุบัน" : "เลือกแพ็กเกจ"}
            </button>
          </div>
        ))}
      </div>

      <div className={card}>
        <div className="flex items-center gap-3 mb-4">
          <CreditCard size={18} className="text-blue-400" />
          <span className="font-semibold">วิธีชำระเงิน</span>
          <span className={`text-sm ${sub}`}>Visa **** 4242</span>
        </div>
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Zap size={18} /> ประวัติการชำระเงิน</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={sub}>
              <th className="text-left pb-3">วันที่</th><th className="text-left pb-3">รายละเอียด</th>
              <th className="text-right pb-3">จำนวน</th><th className="text-left pb-3">สถานะ</th>
            </tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className={`border-t ${isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-100"}`}>
                  <td className="py-3">{inv.date}</td><td>{inv.desc}</td>
                  <td className="text-right">฿{inv.amount}</td>
                  <td><span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400">{inv.status}</span></td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={4} className={`py-8 text-center ${sub}`}>ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
