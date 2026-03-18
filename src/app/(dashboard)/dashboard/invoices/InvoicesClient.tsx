"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Clock, FileText, AlertTriangle, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface InvoiceRow {
  _id: string;
  id: string;
  customer: string;
  item: string;
  amount: number;
  issued: string;
  rawIssued: string;
  due: string;
  rawDue: string;
  status: string;
}

const statusStyle: Record<string, string> = {
  "ชำระแล้ว": "bg-green-500/20 text-green-400",
  "ค้างชำระ": "bg-yellow-500/20 text-yellow-400",
  "เกินกำหนด": "bg-red-500/20 text-red-400",
};

export default function InvoicesClient({ invoices: initial }: { invoices: InvoiceRow[] }) {
  const { isDark } = useTheme();
  const [data] = useState(initial);
  const pending = data.filter(d => d.status === "ค้างชำระ").length;
  const overdue = data.filter(d => d.status === "เกินกำหนด").length;
  const total = data.reduce((s, d) => s + d.amount, 0);

  const columns: Column<InvoiceRow>[] = [
    { key: "id", label: "เลขที่", render: (r, isDark) => <span className={`font-mono ${isDark ? "text-white" : "text-gray-900"}`}>{r.id}</span> },
    { key: "customer", label: "ลูกค้า", render: (r, isDark) => <span className={isDark ? "text-white" : "text-gray-900"}>{r.customer}</span> },
    { key: "item", label: "รายการ" },
    { key: "amount", label: "จำนวนเงิน", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>฿{r.amount.toLocaleString()}</span> },
    { key: "issued", label: "ออก" },
    { key: "due", label: "ครบกำหนด" },
    { key: "status", label: "สถานะ", render: (r) => <span className={`px-2 py-1 rounded-full text-xs ${statusStyle[r.status]}`}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="ใบแจ้งหนี้ขาออก" description="จัดการใบแจ้งหนี้สำหรับลูกค้า" actionLabel="สร้างใบแจ้งหนี้" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ทั้งหมด" value={data.length + " รายการ"} icon={<FileText size={20} />} color="text-blue-500" />
        <StatsCard label="ค้างชำระ" value={pending + " รายการ"} icon={<Clock size={20} />} color="text-yellow-500" />
        <StatsCard label="เกินกำหนด" value={overdue + " รายการ"} icon={<AlertTriangle size={20} />} color="text-red-500" />
        <StatsCard label="มูลค่ารวม" value={"฿" + total.toLocaleString()} icon={<Wallet size={20} />} color="text-green-500" />
      </div>

      <DataTable columns={columns} data={data} rowKey={(r) => r._id} dateField="rawIssued" columnConfigKey="invoices" />
    </div>
  );
}
