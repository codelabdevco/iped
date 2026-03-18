"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Users, Search, UserPlus, Banknote } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import Baht from "@/components/dashboard/Baht";

interface CustomerRow {
  _id: string;
  name: string;
  total: number;
  count: number;
  lastDate: string;
  rawLastDate: string;
}

export default function CustomersClient({ customers: initial }: { customers: CustomerRow[] }) {
  const { isDark } = useTheme();
  const [data] = useState(initial);
  const [q, setQ] = useState("");
  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";
  const filtered = data.filter(d => d.name.toLowerCase().includes(q.toLowerCase()));
  const totalAmount = data.reduce((a, d) => a + d.total, 0);

  const columns: Column<CustomerRow>[] = [
    { key: "name", label: "ชื่อ", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.name}</span> },
    { key: "count", label: "จำนวนรายการ", render: (r) => <span>{r.count} รายการ</span> },
    { key: "total", label: "ยอดสะสม", align: "right", render: (r) => <Baht value={r.total} /> },
    { key: "lastDate", label: "ล่าสุด" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="รายชื่อลูกค้า" description="จัดการลูกค้าและคู่ค้า" actionLabel="เพิ่มลูกค้า" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="ลูกค้าทั้งหมด" value={`${data.length}`} icon={<Users size={20} />} color="text-blue-500" />
        <StatsCard label="มีรายการ" value={`${data.filter(d => d.count > 0).length}`} icon={<UserPlus size={20} />} color="text-green-500" />
        <StatsCard label="ยอดรวมทั้งหมด" value={`฿${totalAmount.toLocaleString()}`} icon={<Banknote size={20} />} color="text-green-500" />
      </div>
      <div className={`${c} border ${b} rounded-xl px-4 py-2.5 flex items-center gap-2`}>
        <Search size={16} className={s} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาลูกค้า..." className={`flex-1 bg-transparent outline-none text-sm ${t} placeholder:${s}`} />
      </div>
      <DataTable columns={columns} data={filtered} rowKey={(r) => r._id} dateField="rawLastDate" columnConfigKey="customers" />
    </div>
  );
}
