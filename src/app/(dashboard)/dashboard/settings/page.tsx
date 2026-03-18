import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import SettingsClient from "./SettingsClient";

async function SettingsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const [user, catAgg] = await Promise.all([
    User.findById(session.userId).lean(),
    Receipt.aggregate([
      { $match: { userId: session.userId, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { category: "$category", direction: { $ifNull: ["$direction", "expense"] } },
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]),
  ]);

  if (!user) return null;
  const u = user as any;

  const profile = {
    _id: String(u._id),
    name: u.name || "",
    lineDisplayName: u.lineDisplayName || "",
    lineProfilePic: u.lineProfilePic || "",
    email: u.email || "",
    phone: u.phone || "",
    birthDate: u.birthDate ? new Date(u.birthDate).toISOString().slice(0, 10) : "",
    gender: u.gender || "",
    occupation: u.occupation || "",
    accountType: u.accountType || "personal",
    businessName: u.businessName || "",
    monthlyBudget: u.monthlyBudget || 0,
    googleEmail: u.googleEmail || "",
    googleConnectedAt: u.googleConnectedAt ? new Date(u.googleConnectedAt).toISOString() : "",
    settings: {
      language: u.settings?.language || "th",
      currency: u.settings?.currency || "THB",
      timezone: u.settings?.timezone || "Asia/Bangkok",
      lineAlerts: u.settings?.notifications?.lineAlerts ?? true,
      emailAlerts: u.settings?.notifications?.emailAlerts ?? false,
      budgetWarning: u.settings?.notifications?.budgetWarning ?? 80,
      dailySummary: u.settings?.notifications?.dailySummary ?? true,
      dailySummaryTime: u.settings?.notifications?.dailySummaryTime || "20:00",
      pdpaConsent: u.settings?.pdpaConsent ?? false,
      dataRetentionDays: u.settings?.dataRetentionDays ?? 365,
    },
  };

  const categoryStats = catAgg.map((item: any) => ({
    name: item._id.category || "ไม่ระบุ",
    direction: item._id.direction || "expense",
    count: item.count,
    total: item.total,
  }));

  return <SettingsClient profile={profile} categoryStats={categoryStats} />;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /></div>}>
      <SettingsData />
    </Suspense>
  );
}
