export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getSession, canViewAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import Package from "@/models/Package";
import Usage from "@/models/Usage";
import SubsClient from "./SubsClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function SubsData() {
  const session = await getSession();
  if (!session) redirect("/login");
  await connectDB();
  const currentUser = await User.findById(session.userId).select("role").lean() as any;
  if (!currentUser || !canViewAdmin(currentUser.role || session.role)) redirect("/dashboard");

  const now = new Date();
  const [subs, packages, users, usages] = await Promise.all([
    Subscription.find().populate("packageId").sort({ createdAt: -1 }).lean(),
    Package.find({ status: "active" }).sort({ sortOrder: 1 }).lean(),
    User.find().select("name lineDisplayName email").lean(),
    Usage.find({ month: now.getMonth() + 1, year: now.getFullYear() }).lean(),
  ]);

  const userMap: Record<string, any> = {};
  users.forEach((u: any) => { userMap[String(u._id)] = u; });
  const usageMap: Record<string, any> = {};
  usages.forEach((u: any) => { usageMap[u.userId] = u; });

  const data = subs.map((s: any) => {
    const user = userMap[s.userId] || {};
    const usage = usageMap[s.userId] || {};
    const pkg = s.packageId as any;
    return {
      _id: String(s._id),
      userId: s.userId,
      userName: user.lineDisplayName || user.name || "ไม่ระบุ",
      userEmail: user.email || "",
      packageName: pkg?.name || "Free",
      packageTier: pkg?.tier || "free",
      status: s.status,
      billingCycle: s.billingCycle || "monthly",
      currentPeriodEnd: s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toISOString() : "",
      receiptsUsed: usage.receipts || 0,
      ocrUsed: usage.ocr || 0,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : "",
    };
  });

  const pkgOptions = packages.map((p: any) => ({ value: p.tier, label: `${p.name} (${p.type})` }));

  const stats = {
    total: subs.length,
    free: subs.filter((s: any) => (s.packageId as any)?.tier === "free").length,
    paid: subs.filter((s: any) => (s.packageId as any)?.tier !== "free").length,
    trial: subs.filter((s: any) => s.status === "trial").length,
  };

  return <SubsClient subs={serialize(data)} packages={serialize(pkgOptions)} stats={stats} />;
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-48 rounded-lg bg-white/[0.06]" /><div className="h-64 rounded-2xl bg-white/[0.04]" /></div>}>
      <SubsData />
    </Suspense>
  );
}
