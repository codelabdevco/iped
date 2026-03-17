"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, ShieldCheck, FileText, Database, UserX, Lock, Clock } from "lucide-react";

const initPdpa = [
  { label: "ความยินยอม", desc: "ผู้ใช้ยินยอม 1,180/1,247", icon: ShieldCheck, color: "text-green-400", pct: "94.6%" },
  { label: "นโยบาย", desc: "อัปเดตล่าสุด 2026-03-01", icon: FileText, color: "text-blue-400", pct: "v3.2" },
  { label: "การเก็บข้อมูล", desc: "เก็บ 12 เดือน, ลบอัตโนมัติ", icon: Database, color: "text-purple-400", pct: "12M" },
  { label: "สิทธิ์ลบ", desc: "คำขอลบ 3 รายการรอดำเนินการ", icon: UserX, color: "text-orange-400", pct: "3" },
];
const initLogs = [
  { id: 1, time: "2026-03-17 10:45", user: "somchai@email.com", action: "เข้าสู่ระบบ", ip: "203.150.12.45", status: "สำเร็จ" },
  { id: 2, time: "2026-03-17 10:30", user: "pimjai@email.com", action: "แก้ไขข้อมูลส่วนตัว", ip: "110.164.88.12", status: "สำเร็จ" },
  { id: 3, time: "2026-03-17 09:55", user: "wittaya@email.com", action: "ดาวน์โหลดรายงาน", ip: "58.97.12.100", status: "สำเร็จ" },
  { id: 4, time: "2026-03-17 09:20", user: "napa@email.com", action: "เข้าสู่ระบบ", ip: "183.88.45.67", status: "ล้มเหลว" },
  { id: 5, time: "2026-03-17 08:45", user: "thana@email.com", action: "อัปโหลดใบเสร็จ", ip: "171.96.33.21", status: "สำเร็จ" },
  { id: 6, time: "2026-03-16 22:10", user: "arun@email.com", action: "เปลี่ยนรหัสผ่าน", ip: "124.120.77.89", status: "สำเร็จ" },
  { id: 7, time: "2026-03-16 20:30", user: "kamol@email.com", action: "เข้าสู่ระบบ", ip: "49.228.105.44", status: "สำเร็จ" },
  { id: 8, time: "2026-03-16 18:15", user: "unknown@test.com", action: "เข้าสู่ระบบ", ip: "89.44.12.33", status: "ล้มเหลว" },
  { id: 9, time: "2026-03-16 16:00", user: "preeya@email.com", action: "ลบใบเสร็จ", ip: "203.150.55.12", status: "สำเร็จ" },
  { id: 10, time: "2026-03-16 14:30", user: "somchai@email.com", action: "เปิดใช้ 2FA", ip: "203.150.12.45", status: "สำเร็จ" },
];

export default function Page() {
  const { isDark } = useTheme();
  const [pdpa, setPdpa] = useState(initPdpa);
  const [logs, setLogs] = useState(initLogs);
  const [twoFA, setTwoFA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const card = `rounded-xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const clearDemo = () => { setPdpa([]); setLogs([]); };

  return (
    <div className={`p-6 space-y-6 ${txt}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PDPA & Audit Logs</h1>
        <button onClick={clearDemo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm">
          <Trash2 size={16} /> ล้างข้อมูลตัวอย่าง
        </button>
      </div>

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

      <div className={card}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock size={18} /> Audit Logs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={sub}>
              <th className="text-left pb-3">เวลา</th><th className="text-left pb-3">ผู้ใช้</th>
              <th className="text-left pb-3">การกระทำ</th><th className="text-left pb-3">IP</th><th className="text-left pb-3">สถานะ</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className={`border-t ${isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-100"}`}>
                  <td className="py-2 whitespace-nowrap">{l.time}</td><td>{l.user}</td><td>{l.action}</td><td className="font-mono text-xs">{l.ip}</td>
                  <td><span className={`px-2 py-1 rounded-full text-xs ${l.status === "สำเร็จ" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{l.status}</span></td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className={`py-8 text-center ${sub}`}>ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
