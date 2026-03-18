"use client";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface TeamMember {
  id: string;
  name: string;
  dept: string;
  position: string;
  email: string;
  role: string;
  active: boolean;
}

interface DeptInfo {
  name: string;
  count: number;
  icon: string;
}

interface TeamClientProps {
  members: TeamMember[];
  departments: DeptInfo[];
}

const roleColor: Record<string, string> = {
  Admin: "bg-purple-500/20 text-purple-400",
  Manager: "bg-blue-500/20 text-blue-400",
  User: "bg-gray-500/20 text-gray-400",
};

export default function TeamClient({ members, departments }: TeamClientProps) {
  const { isDark } = useTheme();
  const c = (d: string, l: string) => (isDark ? d : l);

  const columns: Column<TeamMember>[] = [
    { key: "name", label: "ชื่อ" },
    { key: "dept", label: "แผนก" },
    { key: "position", label: "ตำแหน่ง" },
    { key: "email", label: "อีเมล", render: (r) => <span className="font-mono text-xs">{r.email}</span> },
    { key: "role", label: "สิทธิ์", render: (r) => <span className={`px-2 py-1 rounded-full text-xs ${roleColor[r.role] || roleColor.User}`}>{r.role}</span> },
    {
      key: "active",
      label: "สถานะ",
      render: (r) => (
        <>
          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${r.active ? "bg-green-400" : "bg-gray-400"}`} />
          <span className="text-xs">{r.active ? "ใช้งาน" : "ปิดใช้งาน"}</span>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="พนักงาน & แผนก" description="จัดการทีมและสิทธิ์การใช้งาน" actionLabel="เชิญพนักงาน" />

      {departments.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {departments.map((d) => (
            <div
              key={d.name}
              className={`p-4 rounded-xl border flex items-center gap-3 ${c(
                "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]",
                "bg-white border-gray-200"
              )}`}
            >
              <span className="text-2xl">{d.icon}</span>
              <div>
                <p className={`font-medium ${c("text-white", "text-gray-900")}`}>{d.name}</p>
                <p className={`text-sm ${c("text-white/50", "text-gray-500")}`}>{d.count} คน</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable columns={columns} data={members} rowKey={(r) => r.id} />
    </div>
  );
}
