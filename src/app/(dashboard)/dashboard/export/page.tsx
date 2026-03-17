"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Download, FileText, Table, FileSpreadsheet, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface ExportEntry {
  id: number; name: string; date: string; size: string; type: string;
}

const INIT: ExportEntry[] = [
  { id: 1, name: "iPED-report-2569-03.pdf", date: "15/03/2569", size: "2.4 MB", type: "PDF" },
  { id: 2, name: "receipts-march-2569.csv", date: "14/03/2569", size: "156 KB", type: "CSV" },
  { id: 3, name: "expenses-q1-2569.xlsx", date: "10/03/2569", size: "890 KB", type: "Excel" },
  { id: 4, name: "categories-summary.pdf", date: "01/03/2569", size: "1.1 MB", type: "PDF" },
];
export default function ExportPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";
  const btn = isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200";
  const colors: Record<string, string> = { PDF: "text-red-500 bg-red-500/10", CSV: "text-green-500 bg-green-500/10", Excel: "text-blue-500 bg-blue-500/10" };

  const columns: Column<ExportEntry>[] = [
    { key: "name", label: "ชื่อไฟล์", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.name}</span> },
    { key: "date", label: "วันที่" },
    { key: "size", label: "ขนาด" },
    { key: "type", label: "ประเภท", render: (r) => <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${colors[r.type]}`}>{r.type}</span> },
    { key: "actions", label: "", render: () => <button className={`p-2 rounded-lg ${btn}`}><Download size={14}/></button> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="ส่งออก PDF / CSV" description="ส่งออกข้อมูลในรูปแบบต่างๆ" onClear={() => setData([])} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: "PDF Report", desc: "รายงานสรุปพร้อมกราฟ", icon: FileText, color: "text-red-500 bg-red-500/10" }, { label: "CSV Data", desc: "ข้อมูลดิบสำหรับ Excel", icon: Table, color: "text-green-500 bg-green-500/10" }, { label: "Excel (.xlsx)", desc: "ไฟล์ Excel พร้อมใช้", icon: FileSpreadsheet, color: "text-blue-500 bg-blue-500/10" }].map((e, i) => {
          const Icon = e.icon;
          return <div key={i} className={`${c} border ${b} rounded-2xl p-5 cursor-pointer transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${e.color} mb-3`}><Icon size={20} /></div><p className={`font-semibold ${t}`}>{e.label}</p><p className={`text-xs ${s} mt-1`}>{e.desc}</p><button className="mt-3 px-4 py-2 rounded-xl text-xs font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors">ส่งออก</button></div>;
        })}
      </div>
      <DataTable columns={columns} data={data} rowKey={(r) => r.id} />
    </div>
  );
}
