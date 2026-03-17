"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Mail, Trash2, Paperclip, FileText, CheckCircle, Search } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface EmailEntry {
  id: number; subject: string; sender: string; date: string; attachments: number; status: string;
}

const INIT: EmailEntry[] = [
  { id: 1, subject: "ใบเสร็จค่าบริการ Cloud - มี.ค. 2569", sender: "billing@aws.amazon.com", date: "15/03/2569", attachments: 1, status: "scanned" },
  { id: 2, subject: "ใบแจ้งหนี้ค่าโทรศัพท์", sender: "billing@truemoveh.com", date: "14/03/2569", attachments: 1, status: "scanned" },
  { id: 3, subject: "Payment Receipt - Figma Pro", sender: "receipts@figma.com", date: "12/03/2569", attachments: 2, status: "scanned" },
  { id: 4, subject: "ใบเสร็จค่าประกัน", sender: "service@aia.co.th", date: "10/03/2569", attachments: 1, status: "processing" },
  { id: 5, subject: "Invoice #4521 - Hosting", sender: "billing@hostinger.com", date: "08/03/2569", attachments: 1, status: "scanned" },
];
const stMap: Record<string,{label:string;cls:string}> = { scanned: { label: "สแกนแล้ว", cls: "bg-green-500/10 text-green-400" }, processing: { label: "กำลังประมวลผล", cls: "bg-yellow-500/10 text-yellow-400" } };
export default function EmailScannerPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";

  const columns: Column<EmailEntry>[] = [
    { key: "subject", label: "หัวข้อ", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.subject}</span> },
    { key: "sender", label: "ผู้ส่ง" },
    { key: "date", label: "วันที่" },
    { key: "attachments", label: "แนบ", render: (r, isDark) => <span className="flex items-center gap-4"><Paperclip size={12} className={isDark ? "text-white/50" : "text-gray-500"} /><span className={isDark ? "text-white/50" : "text-gray-500"}>{r.attachments}</span></span> },
    { key: "status", label: "สถานะ", render: (r) => { const st = stMap[r.status]; return <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span>; } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Email Scanner" description="สแกนเอกสารจากอีเมลอัตโนมัติ" onClear={() => setData([])} />
      <div className={`${c} border ${b} rounded-2xl p-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Mail size={20} className="text-blue-500" /></div><div><p className={`font-semibold ${t}`}>Gmail เชื่อมต่อแล้ว</p><p className={`text-sm ${s}`}>demo@iped.co</p></div></div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400`}>ใช้งานอยู่</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="อีเมลที่สแกน" value={`${data.length}`} icon={<Search size={20} />} color="text-blue-500" />
        <StatsCard label="เอกสารที่พบ" value={`${data.reduce((a,d)=>a+d.attachments,0)}`} icon={<FileText size={20} />} color="text-blue-500" />
        <StatsCard label="จัดหมวดอัตโนมัติ" value={`${data.filter(d=>d.status==="scanned").length}`} icon={<CheckCircle size={20} />} color="text-green-500" />
      </div>
      <DataTable columns={columns} data={data} rowKey={(r) => r.id} />
    </div>
  );
}
