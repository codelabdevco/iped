"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Mail, FileText, CheckCircle, Search } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface EmailRow {
  _id: string;
  emailSubject: string;
  emailFrom: string;
  date: string;
  status: string;
}

interface Props {
  emails: EmailRow[];
  googleEmail: string | null;
  googleConnected: boolean;
  totalScanned: number;
  totalWithOcr: number;
}

const stMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "รอดำเนินการ", cls: "bg-yellow-500/10 text-yellow-400" },
  confirmed: { label: "ยืนยันแล้ว", cls: "bg-green-500/10 text-green-400" },
  edited: { label: "แก้ไขแล้ว", cls: "bg-blue-500/10 text-blue-400" },
  paid: { label: "ชำระแล้ว", cls: "bg-green-500/10 text-green-400" },
  overdue: { label: "เกินกำหนด", cls: "bg-red-500/10 text-red-400" },
  matched: { label: "จับคู่แล้ว", cls: "bg-purple-500/10 text-purple-400" },
  cancelled: { label: "ยกเลิก", cls: "bg-gray-500/10 text-gray-400" },
  rejected: { label: "ปฏิเสธ", cls: "bg-red-500/10 text-red-400" },
  awaiting_approval: { label: "รออนุมัติ", cls: "bg-orange-500/10 text-orange-400" },
};

export default function EmailScannerClient({ emails, googleEmail, googleConnected, totalScanned, totalWithOcr }: Props) {
  const { isDark } = useTheme();
  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";

  const columns: Column<EmailRow>[] = [
    {
      key: "emailSubject",
      label: "หัวข้อ",
      render: (r, isDark) => (
        <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.emailSubject}</span>
      ),
    },
    { key: "emailFrom", label: "ผู้ส่ง" },
    { key: "date", label: "วันที่" },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => {
        const st = stMap[r.status] || { label: r.status, cls: "bg-gray-500/10 text-gray-400" };
        return <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Email Scanner" description="สแกนเอกสารจากอีเมลอัตโนมัติ" />

      {/* Gmail connection status */}
      <div className={`${c} border ${b} rounded-2xl p-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Mail size={20} className="text-blue-500" />
          </div>
          <div>
            <p className={`font-semibold ${t}`}>
              {googleConnected ? "Gmail เชื่อมต่อแล้ว" : "Gmail ยังไม่เชื่อมต่อ"}
            </p>
            <p className={`text-sm ${s}`}>
              {googleEmail || "ยังไม่เชื่อมต่อ"}
            </p>
          </div>
        </div>
        <div
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            googleConnected ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
          }`}
        >
          {googleConnected ? "ใช้งานอยู่" : "ไม่ได้เชื่อมต่อ"}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="อีเมลที่สแกน" value={`${totalScanned}`} icon={<Search size={20} />} color="text-blue-500" />
        <StatsCard label="เอกสารที่พบ" value={`${totalWithOcr}`} icon={<FileText size={20} />} color="text-blue-500" />
        <StatsCard
          label="จัดหมวดอัตโนมัติ"
          value={`${emails.filter((e) => e.status === "confirmed" || e.status === "matched").length}`}
          icon={<CheckCircle size={20} />}
          color="text-green-500"
        />
      </div>

      {/* Data table */}
      <DataTable dateField="date" columns={columns} data={emails} rowKey={(r) => r._id} />
    </div>
  );
}
