"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TrendingUp, Plus, Trash2, Wallet, ArrowUpRight, BarChart3 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

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

  const columns: Column<IncomeEntry>[] = [
    { key: "date", label: "วันที่", render: (r, isDark) => <span className={isDark ? "text-gray-300" : "text-gray-700"}>{r.date}</span> },
    { key: "source", label: "แหล่งที่มา", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.source}</span> },
    { key: "category", label: "หมวดหมู่", render: (r, isDark) => <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? catDark[r.category] : catLight[r.category]}`}>{r.category}</span> },
    { key: "amount", label: "จำนวนเงิน", render: (r) => <span className="font-semibold text-green-500">+{fmt(r.amount)}</span> },
    { key: "note", label: "หมายเหตุ" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="รายรับ" description="จัดการรายรับทั้งหมดของคุณ" onClear={clearDemo} actionLabel="เพิ่มรายรับ" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="รายรับเดือนนี้" value={fmt(thisMonth)} icon={<Wallet size={20} />} color="text-green-500" />
        <StatsCard label="เดือนที่แล้ว" value={fmt(lastMonth)} icon={<ArrowUpRight size={20} />} color="text-blue-500" />
        <StatsCard label="เฉลี่ย/เดือน" value={fmt(avg)} icon={<BarChart3 size={20} />} color="text-purple-500" />
      </div>
      <DataTable columns={columns} data={demoData} rowKey={(r) => r.id} />
    </div>
  );
}
