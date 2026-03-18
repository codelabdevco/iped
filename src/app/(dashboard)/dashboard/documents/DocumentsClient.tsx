"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { FileText, FileCheck, FileSpreadsheet, File } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import Baht from "@/components/dashboard/Baht";

interface DocEntry {
  _id: string;
  type: string;
  merchant: string;
  category: string;
  categoryIcon: string;
  date: string;
  amount: number;
  status: string;
  documentNumber?: string;
}

interface Props {
  documents: DocEntry[];
  stats: { total: number; confirmed: number; pending: number };
}

const typeLabels: Record<string, string> = {
  tax_invoice: "ใบกำกับภาษี",
  invoice: "ใบแจ้งหนี้",
  quotation: "ใบเสนอราคา",
  billing: "ใบวางบิล",
  receipt: "ใบเสร็จรับเงิน",
  debit_note: "ใบเพิ่มหนี้",
  credit_note: "ใบลดหนี้",
};

const statusStyle: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "จัดเก็บแล้ว", cls: "bg-green-500/20 text-green-400" },
  pending: { label: "รอตรวจสอบ", cls: "bg-yellow-500/20 text-yellow-400" },
  cancelled: { label: "ยกเลิก", cls: "bg-red-500/20 text-red-400" },
};

export default function DocumentsClient({ documents, stats }: Props) {
  const { isDark } = useTheme();

  const columns: Column<DocEntry>[] = [
    {
      key: "merchant",
      label: "ชื่อเอกสาร",
      render: (r, isDark) => (
        <div className="flex items-center gap-2">
          <span>{r.categoryIcon}</span>
          <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.merchant}</span>
        </div>
      ),
    },
    {
      key: "type",
      label: "ประเภท",
      render: (r) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400">
          {typeLabels[r.type] || r.type}
        </span>
      ),
    },
    { key: "documentNumber", label: "เลขที่" },
    { key: "category", label: "หมวดหมู่" },
    {
      key: "date",
      label: "วันที่",
      render: (r) => new Date(r.date).toLocaleDateString("th-TH"),
    },
    {
      key: "amount",
      label: "จำนวนเงิน",
      align: "right",
      render: (r) => <Baht value={r.amount} />,
    },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => {
        const st = statusStyle[r.status] || statusStyle.pending;
        return <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="เอกสาร" description="จัดเก็บและจัดการเอกสารทั้งหมด" actionLabel="อัปโหลดเอกสาร" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="เอกสารทั้งหมด" value={`${stats.total} ฉบับ`} icon={<FileText size={20} />} color="text-blue-500" />
        <StatsCard label="จัดเก็บแล้ว" value={`${stats.confirmed} ฉบับ`} icon={<FileCheck size={20} />} color="text-green-500" />
        <StatsCard label="รอตรวจสอบ" value={`${stats.pending} ฉบับ`} icon={<FileSpreadsheet size={20} />} color="text-yellow-500" />
        <StatsCard label="ทั้งหมด" value={`${documents.length} ฉบับ`} icon={<File size={20} />} color="text-purple-500" />
      </div>
      <DataTable columns={columns} data={documents} rowKey={(r) => r._id} />
    </div>
  );
}
