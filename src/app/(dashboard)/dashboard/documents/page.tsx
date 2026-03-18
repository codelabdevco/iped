"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { FileText, FolderOpen, Download, Eye, Trash2, File, Receipt, FileSpreadsheet, FileCheck } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface DocEntry {
  id: number; name: string; type: string; category: string; date: string; size: string; status: string;
}

const typeIcon: Record<string, string> = { "ใบกำกับภาษี": "📄", "ใบสั่งจ่าย": "💳", "ใบแจ้งหนี้": "📑", "สัญญา": "📋", "ใบเสร็จรับเงิน": "🧾", "หนังสือรับรอง": "📜" };
const statusStyle: Record<string, string> = { "จัดเก็บแล้ว": "bg-green-500/20 text-green-400", "รอตรวจสอบ": "bg-yellow-500/20 text-yellow-400", "หมดอายุ": "bg-red-500/20 text-red-400" };

const INIT: DocEntry[] = [
  { id: 1, name: "ใบกำกับภาษี บจก.สยามเทค", type: "ใบกำกับภาษี", category: "ภาษี", date: "15/03/2569", size: "245 KB", status: "จัดเก็บแล้ว" },
  { id: 2, name: "ใบสั่งจ่ายค่าเช่าสำนักงาน มี.ค.", type: "ใบสั่งจ่าย", category: "สำนักงาน", date: "01/03/2569", size: "180 KB", status: "จัดเก็บแล้ว" },
  { id: 3, name: "ใบแจ้งหนี้ค่าอินเทอร์เน็ต TRUE", type: "ใบแจ้งหนี้", category: "สาธารณูปโภค", date: "10/03/2569", size: "92 KB", status: "รอตรวจสอบ" },
  { id: 4, name: "สัญญาจ้างพัฒนาระบบ Phase 2", type: "สัญญา", category: "สัญญา", date: "20/02/2569", size: "1.2 MB", status: "จัดเก็บแล้ว" },
  { id: 5, name: "ใบเสร็จค่าเครื่องพิมพ์ Brother", type: "ใบเสร็จรับเงิน", category: "อุปกรณ์", date: "05/03/2569", size: "156 KB", status: "จัดเก็บแล้ว" },
  { id: 6, name: "หนังสือรับรองบริษัท ปี 2569", type: "หนังสือรับรอง", category: "องค์กร", date: "15/01/2569", size: "320 KB", status: "จัดเก็บแล้ว" },
  { id: 7, name: "ใบกำกับภาษี ค่าโฆษณา Facebook", type: "ใบกำกับภาษี", category: "การตลาด", date: "28/02/2569", size: "110 KB", status: "รอตรวจสอบ" },
  { id: 8, name: "สัญญาเช่าสำนักงาน (หมดอายุ)", type: "สัญญา", category: "สัญญา", date: "01/01/2568", size: "2.1 MB", status: "หมดอายุ" },
  { id: 9, name: "ใบแจ้งหนี้ค่าไฟฟ้า MEA", type: "ใบแจ้งหนี้", category: "สาธารณูปโภค", date: "12/03/2569", size: "88 KB", status: "จัดเก็บแล้ว" },
  { id: 10, name: "ใบเสร็จค่าประกันภัย ปี 2569", type: "ใบเสร็จรับเงิน", category: "ประกัน", date: "10/01/2569", size: "430 KB", status: "จัดเก็บแล้ว" },
];

export default function DocumentsPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const stored = data.filter(d => d.status === "จัดเก็บแล้ว").length;
  const pending = data.filter(d => d.status === "รอตรวจสอบ").length;
  const expired = data.filter(d => d.status === "หมดอายุ").length;

  const columns: Column<DocEntry>[] = [
    { key: "name", label: "ชื่อเอกสาร", render: (r, isDark) => (
      <div className="flex items-center gap-2">
        <span>{typeIcon[r.type] || "📄"}</span>
        <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.name}</span>
      </div>
    )},
    { key: "type", label: "ประเภท", render: (r) => <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400">{r.type}</span> },
    { key: "category", label: "หมวดหมู่" },
    { key: "date", label: "วันที่" },
    { key: "size", label: "ขนาด", align: "right" },
    { key: "status", label: "สถานะ", render: (r) => <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle[r.status]}`}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="เอกสาร" description="จัดเก็บและจัดการเอกสารทั้งหมด" onClear={() => setData([])} actionLabel="อัปโหลดเอกสาร" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="เอกสารทั้งหมด" value={`${data.length} ฉบับ`} icon={<FileText size={20} />} color="text-blue-500" />
        <StatsCard label="จัดเก็บแล้ว" value={`${stored} ฉบับ`} icon={<FileCheck size={20} />} color="text-green-500" />
        <StatsCard label="รอตรวจสอบ" value={`${pending} ฉบับ`} icon={<FileSpreadsheet size={20} />} color="text-yellow-500" />
        <StatsCard label="หมดอายุ" value={`${expired} ฉบับ`} icon={<File size={20} />} color="text-red-500" />
      </div>

      <DataTable columns={columns} data={data} rowKey={(r) => r.id} />
    </div>
  );
}
