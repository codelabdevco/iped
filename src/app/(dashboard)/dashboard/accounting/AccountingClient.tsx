"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Link2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface Integration {
  id: number;
  name: string;
  status: "connected" | "disconnected";
  lastSync: string;
  records: number;
}

interface SyncLog {
  _id: string;
  time: string;
  system: string;
  event: string;
  status: string;
}

const defaultIntegrations: Integration[] = [
  { id: 1, name: "PEAK", status: "disconnected", lastSync: "-", records: 0 },
  { id: 2, name: "FlowAccount", status: "disconnected", lastSync: "-", records: 0 },
  { id: 3, name: "Express Accounting", status: "disconnected", lastSync: "-", records: 0 },
  { id: 4, name: "QuickBooks", status: "disconnected", lastSync: "-", records: 0 },
];

interface Props {
  integrations?: Integration[];
  syncLogs: SyncLog[];
}

export default function AccountingClient({ integrations = defaultIntegrations, syncLogs }: Props) {
  const { isDark } = useTheme();
  const card = `rounded-xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const columns: Column<SyncLog>[] = [
    { key: "time", label: "เวลา" },
    { key: "system", label: "ระบบ" },
    { key: "event", label: "เหตุการณ์" },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            r.status === "สำเร็จ"
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="เชื่อมโปรแกรมบัญชี" description="เชื่อมต่อกับซอฟต์แวร์บัญชี" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((i) => (
          <div key={i.id} className={card}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{i.name}</h3>
              {i.status === "connected" ? (
                <CheckCircle size={20} className="text-green-400" />
              ) : (
                <XCircle size={20} className="text-red-400" />
              )}
            </div>
            <p className={`text-sm ${sub}`}>
              สถานะ:{" "}
              <span className={i.status === "connected" ? "text-green-400" : "text-red-400"}>
                {i.status === "connected" ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}
              </span>
            </p>
            <p className={`text-sm ${sub} mt-1`}>ซิงค์ล่าสุด: {i.lastSync}</p>
            <p className={`text-sm ${sub} mt-1`}>รายการ: {i.records.toLocaleString()}</p>
            <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-sm">
              {i.status === "connected" ? (
                <>
                  <RefreshCw size={14} /> ซิงค์
                </>
              ) : (
                <>
                  <Link2 size={14} /> เชื่อมต่อ
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={syncLogs} rowKey={(r) => r._id} />
    </div>
  );
}
