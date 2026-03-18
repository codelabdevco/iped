import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import TeamClient from "./TeamClient";

const ROLE_MAP: Record<string, string> = {
  superadmin: "Admin",
  admin: "Admin",
  manager: "Manager",
  accountant: "Manager",
  user: "User",
};

const DEPT_ICONS: Record<string, string> = {
  "การเงิน": "💰",
  "บริหาร": "📋",
  "ปฏิบัติการ": "⚙️",
  "IT": "💻",
  "บัญชี": "📊",
};

async function TeamData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  let users;
  if (session.orgId) {
    users = await User.find({ orgId: session.orgId }).lean();
  } else {
    users = await User.find({ _id: session.userId }).lean();
  }

  const members = users.map((u: any) => ({
    id: u._id.toString(),
    name: u.name || "ไม่ระบุ",
    dept: u.occupation || "-",
    position: u.occupation || "-",
    email: u.email || "-",
    role: ROLE_MAP[u.role] || "User",
    active: u.status === "active",
  }));

  // Build department cards from occupation grouping
  const deptCounts: Record<string, number> = {};
  for (const m of members) {
    if (m.dept && m.dept !== "-") {
      deptCounts[m.dept] = (deptCounts[m.dept] || 0) + 1;
    }
  }

  const departments = Object.entries(deptCounts).map(([name, count]) => ({
    name,
    count,
    icon: DEPT_ICONS[name] || "👥",
  }));

  return <TeamClient members={members} departments={departments} />;
}

export default function TeamPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <TeamData />
    </Suspense>
  );
}
