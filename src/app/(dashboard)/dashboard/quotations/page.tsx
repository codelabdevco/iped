"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, FileText, Plus, Clock, Hash, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface QuotationEntry {
  id: string; customer: string; item: string; amount: number; date: string; expires: string; status: string;
}

const initData: QuotationEntry[] = [
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

  const columns: Column<QuotationEntry>[] = [
    { key: "id", label: "เลขที่", render: (r, isDark) => <span className={`font-mono ${isDark ? "text-white" : "text-gray-900"}`}>{r.id}</span> },
    { key: "customer", label: "ลูกค้า", render: (r, isDark) => <span className={isDark ? "text-white" : "text-gray-900"}>{r.customer}</span> },
    { key: "item", label: "รายการ" },
    { key: "amount", label: "จำนวนเงิน", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>฿{r.amount.toLocaleString()}</span> },
    { key: "date", label: "วันที่" },
    { key: "expires", label: "หมดอายุ" },
    { key: "status", label: "สถานะ", render: (r) => <span className={`px-2 py-1 rounded-full text-xs ${statusColor[r.status]}`}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="ใบเสนอราคา" description="จัดการใบเสนอราคาสำหรับลูกค้า" onClear={() => setData([])} actionLabel="สร้างใบเสนอราคา" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="ทั้งหมด" value={data.length + " รายการ"} icon={<FileText size={20} />} color="text-blue-500" />
        <StatsCard label="รออนุมัติ" value={pending + " รายการ"} icon={<Clock size={20} />} color="text-yellow-500" />
        <StatsCard label="มูลค่ารวม" value={"฿" + total.toLocaleString()} icon={<Wallet size={20} />} color="text-green-500" />
      </div>

      <DataTable columns={columns} data={data} rowKey={(r) => r.id} />
    </div>
  );
}
