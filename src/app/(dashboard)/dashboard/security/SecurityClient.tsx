"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ShieldCheck, FileText, Database, UserX, Lock } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface AuditLogRow {
  _id: string;
  time: string;
  user: string;
  action: string;
  ip: string;
  status: "สำเร็จ" | "ล้มเหลว";
  createdAt: string;
}

interface PdpaStats {
  consentPct: string;
  consentDesc: string;
  retentionMonths: string;
  retentionDesc: string;
}

interface Props {
  auditLogs: AuditLogRow[];
  pdpaStats: PdpaStats;
}

export default function SecurityClient({ auditLogs, pdpaStats }: Props) {
  const { isDark } = useTheme();
  const [twoFA, setTwoFA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);

  const card = `rounded-xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const pdpa = [
    { label: "ความยินยอม", desc: pdpaStats.consentDesc, icon: ShieldCheck, color: "text-green-400", pct: pdpaStats.consentPct },
    { label: "นโยบาย", desc: "อัปเดตล่าสุด 2026-03-01", icon: FileText, color: "text-blue-400", pct: "v3.2" },
    { label: "การเก็บข้อมูล", desc: pdpaStats.retentionDesc, icon: Database, color: "text-purple-400", pct: pdpaStats.retentionMonths },
    { label: "สิทธิ์ลบ", desc: "คำขอลบ 0 รายการรอดำเนินการ", icon: UserX, color: "text-orange-400", pct: "0" },
  ];

  const columns: Column<AuditLogRow>[] = [
    { key: "time", label: "เวลา" },
    { key: "user", label: "ผู้ใช้" },
    { key: "action", label: "การกระทำ" },
    { key: "ip", label: "IP", render: (r) => <span className="font-mono text-xs">{r.ip}</span> },
    { key: "status", label: "สถานะ", render: (r) => <span className={`px-2 py-1 rounded-full text-xs ${r.status === "สำเร็จ" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="PDPA & Audit Logs" description="ความปลอดภัยและบันทึกการใช้งาน" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pdpa.map((p) => (
          <div key={p.label} className={card}>
            <div className="flex items-center gap-3 mb-2"><p.icon size={20} className={p.color} /><span className="font-semibold">{p.label}</span></div>
            <p className="text-2xl font-bold mb-1">{p.pct}</p>
            <p className={`text-sm ${sub}`}>{p.desc}</p>
          </div>
        ))}
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Lock size={18} /> ตั้งค่าความปลอดภัย</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="font-medium">Two-Factor Authentication (2FA)</p><p className={`text-sm ${sub}`}>เพิ่มความปลอดภัยด้วยรหัส OTP</p></div>
            <button onClick={() => setTwoFA(!twoFA)} className={`w-12 h-6 rounded-full transition-colors ${twoFA ? "bg-green-500" : "bg-gray-500"}`}>
              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${twoFA ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="font-medium">Session Timeout</p><p className={`text-sm ${sub}`}>ออกจากระบบอัตโนมัติหลัง 30 นาที</p></div>
            <button onClick={() => setSessionTimeout(!sessionTimeout)} className={`w-12 h-6 rounded-full transition-colors ${sessionTimeout ? "bg-green-500" : "bg-gray-500"}`}>
              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${sessionTimeout ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      <DataTable dateField="createdAt" columns={columns} data={auditLogs} rowKey={(r) => r._id} />
    </div>
  );
}
