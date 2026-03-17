"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, Link2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

const initIntegrations = [
  { id: 1, name: "PEAK", status: "connected", lastSync: "2026-03-17 09:30", records: 1245 },
  { id: 2, name: "FlowAccount", status: "connected", lastSync: "2026-03-17 08:15", records: 892 },
  { id: 3, name: "Express Accounting", status: "disconnected", lastSync: "-", records: 0 },
  { id: 4, name: "QuickBooks", status: "disconnected", lastSync: "-", records: 0 },
];
const initLogs = [
  { id: 1, time: "2026-03-17 09:30", system: "PEAK", event: "ซิงค์ใบเสร็จ 45 รายการ", status: "สำเร็จ" },
  { id: 2, time: "2026-03-17 08:15", system: "FlowAccount", event: "ซิงค์ใบกำกับภาษี 12 รายการ", status: "สำเร็จ" },
  { id: 3, time: "2026-03-16 18:00", system: "PEAK", event: "ซิงค์รายจ่าย 28 รายการ", status: "สำเร็จ" },
  { id: 4, time: "2026-03-16 14:22", system: "FlowAccount", event: "ซิงค์ผู้ติดต่อ 8 รายการ", status: "ผิดพลาด" },
  { id: 5, time: "2026-03-16 09:00", system: "PEAK", event: "ซิงค์ใบเสร็จ 33 รายการ", status: "สำเร็จ" },
];

export default function Page() {
  const { isDark } = useTheme();
  const [integrations, setIntegrations] = useState(initIntegrations);
  const [logs, setLogs] = useState(initLogs);
  const card = `rounded-xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const clearDemo = () => { setIntegrations([]); setLogs([]); };

  return (
    <div className={`p-6 space-y-6 ${txt}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">เชื่อมโปรแกรมบัญชี</h1>
        <button onClick={clearDemo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm">
          <Trash2 size={16} /> ล้างข้อมูลตัวอย่าง
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((i) => (
          <div key={i.id} className={card}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{i.name}</h3>
              {i.status === "connected" ? <CheckCircle size={20} className="text-green-400" /> : <XCircle size={20} className="text-red-400" />}
            </div>
            <p className={`text-sm ${sub}`}>สถานะ: <span className={i.status === "connected" ? "text-green-400" : "text-red-400"}>{i.status === "connected" ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}</span></p>
            <p className={`text-sm ${sub} mt-1`}>ซิงค์ล่าสุด: {i.lastSync}</p>
            <p className={`text-sm ${sub} mt-1`}>รายการ: {i.records.toLocaleString()}</p>
            <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-sm">
              {i.status === "connected" ? <><RefreshCw size={14} /> ซิงค์</> : <><Link2 size={14} /> เชื่อมต่อ</>}
            </button>
          </div>
        ))}
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock size={18} /> ประวัติการซิงค์</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={sub}>
              <th className="text-left pb-3">เวลา</th><th className="text-left pb-3">ระบบ</th>
              <th className="text-left pb-3">เหตุการณ์</th><th className="text-left pb-3">สถานะ</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className={`border-t ${isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-100"}`}>
                  <td className="py-3">{l.time}</td><td>{l.system}</td><td>{l.event}</td>
                  <td><span className={`px-2 py-1 rounded-full text-xs ${l.status === "สำเร็จ" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{l.status}</span></td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className={`py-8 text-center ${sub}`}>ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
