"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Users, Plus, Trash2, Search, UserPlus, Banknote } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface CustomerEntry {
  id: number; name: string; taxId: string; email: string; phone: string; total: number; active: boolean;
}

const INIT: CustomerEntry[] = [
  { id: 1, name: "บจก.สยามเทค โซลูชั่น", taxId: "0105560012345", email: "finance@siamtech.co.th", phone: "02-123-4567", total: 450000, active: true },
  { id: 2, name: "หจก.กรุงเทพการค้า", taxId: "0103540098765", email: "account@bkktrade.com", phone: "02-234-5678", total: 280000, active: true },
  { id: 3, name: "บจก.ดิจิตอลเวิร์ค", taxId: "0105580034567", email: "ap@digitalwork.co.th", phone: "02-345-6789", total: 190000, active: true },
  { id: 4, name: "ร้านสหกิจ", taxId: "3100600012345", email: "sahakij@gmail.com", phone: "081-234-5678", total: 85000, active: true },
  { id: 5, name: "บจก.ไทยซอฟต์แวร์", taxId: "0105570045678", email: "billing@thaisoft.co.th", phone: "02-456-7890", total: 520000, active: true },
  { id: 6, name: "บมจ.เอเชียพลัส", taxId: "0107540056789", email: "finance@asiaplus.co.th", phone: "02-567-8901", total: 780000, active: false },
  { id: 7, name: "หจก.นวมินทร์ เซอร์วิส", taxId: "0103550067890", email: "acc@nawamin.com", phone: "02-678-9012", total: 120000, active: true },
  { id: 8, name: "บจก.สมาร์ท โลจิสติกส์", taxId: "0105590078901", email: "ar@smartlog.co.th", phone: "02-789-0123", total: 340000, active: true },
];
export default function CustomersPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const [q, setQ] = useState("");
  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";
  const filtered = data.filter(d => d.name.includes(q) || d.email.includes(q));

  const columns: Column<CustomerEntry>[] = [
    { key: "name", label: "ชื่อ", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.name}</span> },
    { key: "taxId", label: "เลขผู้เสียภาษี" },
    { key: "email", label: "อีเมล" },
    { key: "phone", label: "โทรศัพท์" },
    { key: "total", label: "ยอดสะสม", align: "right", render: (r, isDark) => <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>฿{r.total.toLocaleString()}</span> },
    { key: "status", label: "สถานะ", render: (r) => <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${r.active ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}>{r.active ? "ใช้งาน" : "ไม่ใช้งาน"}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="รายชื่อลูกค้า" description="จัดการลูกค้าและคู่ค้า" onClear={() => setData([])} actionLabel="เพิ่มลูกค้า" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="ลูกค้าทั้งหมด" value={`${data.length}`} icon={<Users size={20} />} color="text-blue-500" />
        <StatsCard label="ใช้งาน" value={`${data.filter(d=>d.active).length}`} icon={<UserPlus size={20} />} color="text-green-500" />
        <StatsCard label="ยอดค้างชำระรวม" value={`฿${data.reduce((a,d)=>a+d.total,0).toLocaleString()}`} icon={<Banknote size={20} />} color="text-green-500" />
      </div>
      <div className={`${c} border ${b} rounded-xl px-4 py-2.5 flex items-center gap-2`}><Search size={16} className={s} /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาลูกค้า..." className={`flex-1 bg-transparent outline-none text-sm ${t} placeholder:${s}`}/></div>
      <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
    </div>
  );
}
