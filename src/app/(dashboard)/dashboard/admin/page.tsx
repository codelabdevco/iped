import { Suspense } from "react";
import { getSession, canViewAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import AdminClient from "./AdminClient";

async function AdminData() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canViewAdmin(session.role)) redirect("/dashboard");

  await connectDB();

  // Count total users
  const totalUsers = await User.countDocuments();

  // Count users created this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

  // Count total receipts
  const totalReceipts = await Receipt.countDocuments();

  // Get users with package info
  const users = await User.find()
    .select("name email role status packageId createdAt")
    .populate("packageId", "tier name")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const userData = users.map((u: any) => ({
    _id: String(u._id),
    name: u.name || "ไม่ระบุ",
    email: u.email || "-",
    plan: u.packageId?.tier
      ? u.packageId.tier.charAt(0).toUpperCase() + u.packageId.tier.slice(1)
      : "Free",
    date: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
    status: u.status === "active" ? "ใช้งาน" : u.status === "suspended" ? "ระงับ" : u.status === "inactive" ? "ไม่ใช้งาน" : "รอดำเนินการ",
  }));

  return (
    <AdminClient
      stats={{ totalUsers, newMonth: newThisMonth, totalReceipts }}
      users={userData}
    />
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white/[0.04]" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-white/[0.04]" />
        </div>
      }
    >
      <AdminData />
    </Suspense>
  );
}
