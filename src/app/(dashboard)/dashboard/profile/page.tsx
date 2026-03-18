import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import ProfileClient from "./ProfileClient";

async function ProfileData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.userId)
    .select("-passwordHash -googleAccessToken -googleRefreshToken")
    .lean() as any;
  if (!user) redirect("/login");

  // Get stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalReceipts, monthReceipts, monthExpense, monthIncome] = await Promise.all([
    Receipt.countDocuments({ userId: session.userId, status: { $ne: "cancelled" } }),
    Receipt.countDocuments({ userId: session.userId, date: { $gte: monthStart }, status: { $ne: "cancelled" } }),
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: monthStart }, direction: { $ne: "income" }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: monthStart }, direction: "income", status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  // Streak: consecutive days with receipts
  const recentDays = await Receipt.aggregate([
    { $match: { userId: session.userId, status: { $ne: "cancelled" } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
    { $sort: { _id: -1 } },
    { $limit: 60 },
  ]);

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (recentDays.some((r: any) => r._id === key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const profile = {
    _id: String(user._id),
    name: user.name || "",
    lineDisplayName: user.lineDisplayName || "",
    lineProfilePic: user.lineProfilePic || "",
    email: user.email || "",
    phone: user.phone || "",
    occupation: user.occupation || "",
    gender: user.gender || "",
    accountType: user.accountType || "personal",
    businessName: user.businessName || "",
    monthlyBudget: user.monthlyBudget || 0,
    goals: user.goals || [],
    googleEmail: user.googleEmail || "",
    googleConnectedAt: user.googleConnectedAt ? new Date(user.googleConnectedAt).toISOString() : "",
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : "",
    status: user.status || "active",
    loginCount: user.loginCount || 0,
    settings: {
      dailySummary: user.settings?.notifications?.dailySummary ?? true,
      dailySummaryTime: user.settings?.notifications?.dailySummaryTime || "20:00",
      lineAlerts: user.settings?.notifications?.lineAlerts ?? true,
      budgetWarning: user.settings?.notifications?.budgetWarning ?? 80,
    },
  };

  const stats = {
    totalReceipts,
    monthReceipts,
    monthExpense: monthExpense[0]?.total || 0,
    monthIncome: monthIncome[0]?.total || 0,
    streak,
    memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "",
  };

  return <ProfileClient profile={profile} stats={stats} />;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-2xl bg-white/[0.04]" />
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
      </div>
    }>
      <ProfileData />
    </Suspense>
  );
}
