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

  const profile = {
    displayName: (user as any).displayName || "",
    pictureUrl: (user as any).pictureUrl || "",
    birthDate: (user as any).birthDate || "",
    gender: (user as any).gender || "",
    occupation: (user as any).occupation || "",
    accountType: (user as any).accountType || "personal",
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
