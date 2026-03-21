import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";
import Organization from "@/models/Organization";
import TeamClient from "./TeamClient";

const DEPT_ICONS: Record<string, string> = {
  "การเงิน": "💰",
  "บริหาร": "📋",
  "ปฏิบัติการ": "⚙️",
  "IT": "💻",
  "บัญชี": "📊",
  "การตลาด": "📣",
  "บุคคล": "👤",
  "ขาย": "🛒",
};

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function TeamData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const empQuery = session.orgId
    ? { $or: [{ orgId: session.orgId }, { userId: session.userId }] }
    : { userId: session.userId };
  const employees = await Employee.find(empQuery)
    .sort({ status: 1, department: 1, name: 1 })
    .lean();

  const members = employees.map((e: any) => ({
    _id: String(e._id),
    employeeCode: e.employeeCode,
    name: e.name,
    nickname: e.nickname || "",
    position: e.position || "-",
    department: e.department || "-",
    employmentType: e.employmentType || "full-time",
    baseSalary: e.baseSalary || 0,
    bankName: e.bankName || "",
    email: e.email || "",
    lineUserId: e.lineUserId || "",
    startDate: e.startDate ? new Date(e.startDate).toISOString() : "",
    status: e.status || "active",
  }));

  // Department cards
  const deptCounts: Record<string, number> = {};
  for (const m of members) {
    if (m.department && m.department !== "-") {
      deptCounts[m.department] = (deptCounts[m.department] || 0) + 1;
    }
  }

  const departments = Object.entries(deptCounts).map(([name, count]) => ({
    name,
    count,
    icon: DEPT_ICONS[name] || "👥",
  }));

  // Stats
  const activeCount = members.filter((m) => m.status === "active").length;
  const probationCount = members.filter((m) => m.status === "probation").length;

  // Org data
  let inviteCode = "";
  let orgName = "";
  let orgDepartments: { _id: string; name: string; description: string }[] = [];
  let orgPositions: { _id: string; name: string; level: number }[] = [];
  if (session.orgId) {
    const org = await Organization.findById(session.orgId).select("inviteCode name departments positions").lean() as any;
    inviteCode = org?.inviteCode || "";
    orgName = org?.name || "";
    orgDepartments = (org?.departments || []).map((d: any) => ({ _id: String(d._id), name: d.name, description: d.description || "" }));
    orgPositions = (org?.positions || []).map((p: any) => ({ _id: String(p._id), name: p.name, level: p.level || 0 }));
  }

  return (
    <TeamClient
      members={serialize(members)}
      departments={serialize(departments)}
      stats={{ total: members.length, active: activeCount, probation: probationCount }}
      inviteCode={inviteCode}
      orgName={orgName}
      orgDepartments={serialize(orgDepartments)}
      orgPositions={serialize(orgPositions)}
    />
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <TeamData />
    </Suspense>
  );
}
