"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { FileText, Clock, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface QuotationRow {
  _id: string;
  id: string;
  customer: string;
  item: string;
  amount: number;
  date: string;
  rawDate: string;
  expires: string;
  rawExpires: string;
  status: string;
}

const statusColor: Record<string, string> = {
  "ร่าง": "bg-gray-500/20 text-gray-400",
  "ส่งแล้ว": "bg-blue-500/20 text-blue-400",
  "อนุมัติ": "bg-green-500/20 text-green-400",
  "ปฏิเสธ": "bg-red-500/20 text-red-400",
  "หมดอายุ": "bg-yellow-500/20 text-yellow-400",
};

export default function QuotationsClient({ quotations: initial }: { quotations: QuotationRow[] }) {
  const { isDark } = useTheme();
  const [data] = useState(initial);
  const pending = data.filter(d => d.status === "ส่งแล้ว").length;
  const total = data.reduce((s, d) => s + d.amount, 0);

  const columns: Column<QuotationRow>[] = [
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
      <PageHeader title="ใบเสนอราคา" description="จัดการใบเสนอราคาสำหรับลูกค้า" actionLabel="สร้างใบเสนอราคา" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="ทั้งหมด" value={data.length + " รายการ"} icon={<FileText size={20} />} color="text-blue-500" />
        <StatsCard label="รออนุมัติ" value={pending + " รายการ"} icon={<Clock size={20} />} color="text-yellow-500" />
        <StatsCard label="มูลค่ารวม" value={"฿" + total.toLocaleString()} icon={<Wallet size={20} />} color="text-green-500" />
      </div>

      <DataTable columns={columns} data={data} rowKey={(r) => r._id} dateField="rawDate" columnConfigKey="quotations" />
    </div>
  );
}
