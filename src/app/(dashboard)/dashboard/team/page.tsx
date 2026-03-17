"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, Users, UserPlus, Clock } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

const deptData = [
  { name: "การเงิน", count: 3, icon: "💰" },
  { name: "ปฏิบัติการ", count: 3, icon: "⚙️" },
  { name: "บริหาร", count: 2, icon: "📋" },
];

const initData = [
  { name: "สมชาย วงศ์สวัสดิ์", dept: "บริหาร", position: "กรรมการผู้จัดการ", email: "somchai@company.co.th", role: "Admin", active: true },
  { name: "สุภาพร แสงทอง", dept: "การเงิน", position: "ผู้จัดการฝ่ายการเงิน", email: "supaporn@company.co.th", role: "Manager", active: true },
  { name: "วิชัย พงศ์ประเสริฐ", dept: "ปฏิบัติการ", position: "ผู้จัดการฝ่ายปฏิบัติการ", email: "wichai@company.co.th", role: "Manager", active: true },
  { name: "นภา ศรีสุข", dept: "การเงิน", position: "นักบัญชีอาวุโส", email: "napa@company.co.th", role: "User", active: true },
  { name: "ธนกร เจริญยิ่ง", dept: "ปฏิบัติการ", position: "วิศวกรระบบ", email: "thanakorn@company.co.th", role: "User", active: true },
  { name: "พิมพ์ชนก รัตนกุล", dept: "การเงิน", position: "เจ้าหน้าที่บัญชี", email: "pimchanok@company.co.th", role: "User", active: false },
  { name: "กิตติพงษ์ อมรรัตน์", dept: "ปฏิบัติการ", position: "เจ้าหน้าที่ IT", email: "kittipong@company.co.th", role: "User", active: true },
  { name: "อรุณี มงคลชัย", dept: "บริหาร", position: "ผู้ช่วยผู้จัดการ", email: "arunee@company.co.th", role: "Manager", active: true },
];

const roleColor: Record<string, string> = { Admin: "bg-purple-500/20 text-purple-400", Manager: "bg-blue-500/20 text-blue-400", User: "bg-gray-500/20 text-gray-400" };

export default function Page() {
  const { isDark } = useTheme();
  const [data, setData] = useState(initData);
  const c = (d: string, l: string) => isDark ? d : l;

  const columns: Column<typeof data[number]>[] = [
    { key: "name", label: "ชื่อ" },
    { key: "dept", label: "แผนก" },
    { key: "position", label: "ตำแหน่ง" },
    { key: "email", label: "อีเมล", render: (r) => <span className="font-mono text-xs">{r.email}</span> },
    { key: "role", label: "สิทธิ์", render: (r) => <span className={`px-2 py-1 rounded-full text-xs ${roleColor[r.role]}`}>{r.role}</span> },
    { key: "active", label: "สถานะ", render: (r) => <><span className={`inline-block w-2 h-2 rounded-full mr-1 ${r.active ? "bg-green-400" : "bg-gray-400"}`} /><span className="text-xs">{r.active ? "ใช้งาน" : "ปิดใช้งาน"}</span></> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="พนักงาน & แผนก" description="จัดการทีมและสิทธิ์การใช้งาน" onClear={() => setData([])} actionLabel="เชิญพนักงาน" />

      <div className="grid grid-cols-3 gap-4">
        {deptData.map(d => (
          <div key={d.name} className={`p-4 rounded-xl border flex items-center gap-3 ${c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
            <span className="text-2xl">{d.icon}</span>
            <div>
              <p className={`font-medium ${c("text-white", "text-gray-900")}`}>{d.name}</p>
              <p className={`text-sm ${c("text-white/50", "text-gray-500")}`}>{d.count} คน</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={data} rowKey={(r) => r.email} />
    </div>
  );
}
