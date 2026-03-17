"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, Users, UserPlus, Receipt, DollarSign, Activity } from "lucide-react";

const initStats = { totalUsers: 1247, newMonth: 89, totalReceipts: 15834, revenue: 285000 };
const initUsers = [
  { id: 1, name: "สมชาย สุขใจ", email: "somchai@email.com", plan: "Pro", date: "2026-01-15", status: "ใช้งาน" },
  { id: 2, name: "พิมพ์ใจ แก้วมณี", email: "pimjai@email.com", plan: "Business", date: "2026-01-20", status: "ใช้งาน" },
  { id: 3, name: "วิทยา จันทร์เพ็ญ", email: "wittaya@email.com", plan: "Free", date: "2026-02-01", status: "ใช้งาน" },
  { id: 4, name: "นภา ศรีสวัสดิ์", email: "napa@email.com", plan: "Pro", date: "2026-02-10", status: "ระงับ" },
  { id: 5, name: "ธนา กิจเจริญ", email: "thana@email.com", plan: "Business", date: "2026-02-14", status: "ใช้งาน" },
  { id: 6, name: "อรุณ แสงทอง", email: "arun@email.com", plan: "Free", date: "2026-02-28", status: "ใช้งาน" },
  { id: 7, name: "กมล รักษ์ไทย", email: "kamol@email.com", plan: "Pro", date: "2026-03-05", status: "ใช้งาน" },
  { id: 8, name: "ปรียา วงศ์งาม", email: "preeya@email.com", plan: "Free", date: "2026-03-12", status: "ระงับ" },
];
const initHealth = [
  { name: "API Server", value: 99.9 }, { name: "Database", value: 100 },
  { name: "Storage", value: 98.5 }, { name: "AI OCR", value: 99.2 },
];

export default function Page() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(initStats);
  const [users, setUsers] = useState(initUsers);
  const [health, setHealth] = useState(initHealth);
  const card = `rounded-xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const clearDemo = () => { setStats({ totalUsers: 0, newMonth: 0, totalReceipts: 0, revenue: 0 }); setUsers([]); setHealth([]); };

  const statCards = [
    { label: "ผู้ใช้ทั้งหมด", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-400" },
    { label: "ใหม่เดือนนี้", value: stats.newMonth.toLocaleString(), icon: UserPlus, color: "text-green-400" },
    { label: "ใบเสร็จทั้งระบบ", value: stats.totalReceipts.toLocaleString(), icon: Receipt, color: "text-purple-400" },
    { label: "รายได้แพ็กเกจ", value: `฿${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-orange-400" },
  ];

  const planColor: Record<string, string> = { Free: "bg-gray-500/10 text-gray-400", Pro: "bg-blue-500/10 text-blue-400", Business: "bg-purple-500/10 text-purple-400" };

  return (
    <div className={`p-6 space-y-6 ${txt}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${txt}`}>Admin Dashboard</h1>
          <p className={`text-sm ${sub}`}>ภาพรวมระบบและผู้ใช้ทั้งหมด</p>
        </div>
        <button onClick={clearDemo} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"} transition-colors`}><Trash2 size={16} />ล้างข้อมูลตัวอย่าง</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={card}>
            <div className="flex items-center gap-3 mb-2"><s.icon size={20} className={s.color} /><span className={sub}>{s.label}</span></div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold mb-4">ผู้ใช้งาน</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={sub}>
              <th className="text-left pb-3">ชื่อ</th><th className="text-left pb-3">อีเมล</th>
              <th className="text-left pb-3">แพ็กเกจ</th><th className="text-left pb-3">วันสมัคร</th><th className="text-left pb-3">สถานะ</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-t ${isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-100"}`}>
                  <td className="py-3">{u.name}</td><td>{u.email}</td>
                  <td><span className={`px-2 py-1 rounded-full text-xs ${planColor[u.plan] || ""}`}>{u.plan}</span></td>
                  <td>{u.date}</td>
                  <td><span className={`px-2 py-1 rounded-full text-xs ${u.status === "ใช้งาน" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{u.status}</span></td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className={`py-8 text-center ${sub}`}>ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Activity size={18} /> System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {health.map((h) => (
            <div key={h.name} className="text-center">
              <p className={`text-sm ${sub}`}>{h.name}</p>
              <p className={`text-2xl font-bold mt-1 ${h.value >= 99.5 ? "text-green-400" : "text-yellow-400"}`}>{h.value}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
