import { Suspense } from "react";
import { getSession, canViewAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import AdminClient from "./AdminClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function AdminData() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canViewAdmin(session.role)) redirect("/dashboard");

  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, newThisMonth, totalReceipts, activeUsers, suspendedUsers, users] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Receipt.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "suspended" }),
    User.find()
      .select("name email lineUserId lineDisplayName lineProfilePic role accountType status onboardingComplete lastLogin loginCount documentsCount createdAt updatedAt occupation phone")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
  ]);

  const userData = users.map((u: any) => ({
    _id: String(u._id),
    name: u.name || u.lineDisplayName || "ไม่ระบุ",
    email: u.email || "",
    lineUserId: u.lineUserId || "",
    lineDisplayName: u.lineDisplayName || "",
    lineProfilePic: u.lineProfilePic || "",
    role: u.role || "user",
    accountType: u.accountType || "personal",
    status: u.status || "active",
    onboardingComplete: !!u.onboardingComplete,
    lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : "",
    loginCount: u.loginCount || 0,
    documentsCount: u.documentsCount || 0,
    occupation: u.occupation || "",
    phone: u.phone || "",
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : "",
  }));

  return (
    <AdminClient
      currentUserId={session.userId}
      stats={{ totalUsers, newMonth: newThisMonth, totalReceipts, active: activeUsers, suspended: suspendedUsers }}
      users={serialize(userData)}
    />
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-48 rounded-lg bg-white/[0.06]" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-white/[0.04]" />)}</div><div className="h-64 rounded-2xl bg-white/[0.04]" /></div>}>
      <AdminData />
    </Suspense>
  );
}
