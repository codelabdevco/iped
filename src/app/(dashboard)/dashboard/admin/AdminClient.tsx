"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Users, UserPlus, Receipt, DollarSign, Activity } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  plan: string;
  date: string;
  status: string;
}

interface AdminStats {
  totalUsers: number;
  newMonth: number;
  totalReceipts: number;
}

interface AdminClientProps {
  stats: AdminStats;
  users: UserRow[];
}

const healthData = [
  { name: "API Server", value: 99.9 },
  { name: "Database", value: 100 },
  { name: "Storage", value: 98.5 },
  { name: "AI OCR", value: 99.2 },
];

export default function AdminClient({ stats, users }: AdminClientProps) {
  const { isDark } = useTheme();
  const card = `rounded-xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const planColor: Record<string, string> = {
    Free: "bg-gray-500/10 text-gray-400",
    Starter: "bg-teal-500/10 text-teal-400",
    Pro: "bg-blue-500/10 text-blue-400",
    Business: "bg-purple-500/10 text-purple-400",
    Enterprise: "bg-orange-500/10 text-orange-400",
  };

  const columns: Column<UserRow>[] = [
    { key: "name", label: "ชื่อ" },
    { key: "email", label: "อีเมล" },
    {
      key: "plan",
      label: "แพ็กเกจ",
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs ${planColor[r.plan] || ""}`}>
          {r.plan}
        </span>
      ),
    },
    { key: "date", label: "วันสมัคร" },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            r.status === "ใช้งาน"
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
      <PageHeader title="Admin Dashboard" description="ภาพรวมระบบและผู้ใช้ทั้งหมด" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ผู้ใช้ทั้งหมด" value={stats.totalUsers.toLocaleString()} icon={<Users size={20} />} color="text-blue-500" />
        <StatsCard label="ใหม่เดือนนี้" value={stats.newMonth.toLocaleString()} icon={<UserPlus size={20} />} color="text-green-500" />
        <StatsCard label="ใบเสร็จทั้งระบบ" value={stats.totalReceipts.toLocaleString()} icon={<Receipt size={20} />} color="text-purple-500" />
        <StatsCard label="รายได้แพ็กเกจ" value="฿-" icon={<DollarSign size={20} />} color="text-orange-500" />
      </div>

      <DataTable dateField="date" columns={columns} data={users} rowKey={(r) => r._id} />

      <div className={card}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity size={18} /> System Health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {healthData.map((h) => (
            <div key={h.name} className="text-center">
              <p className={`text-sm ${sub}`}>{h.name}</p>
              <p className={`text-2xl font-bold mt-1 ${h.value >= 99.5 ? "text-green-400" : "text-yellow-400"}`}>
                {h.value}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
