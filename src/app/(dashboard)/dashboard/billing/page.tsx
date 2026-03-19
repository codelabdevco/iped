export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getUserPlan } from "@/lib/quota";
import Package from "@/models/Package";
import BillingClient from "./BillingClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function BillingData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const [userPlan, packages] = await Promise.all([
    getUserPlan(session.userId),
    Package.find({ status: "active" }).sort({ sortOrder: 1 }).lean(),
  ]);

  const plans = packages.map((pkg: any) => ({
    _id: String(pkg._id),
    name: pkg.name,
    nameEn: pkg.nameEn,
    tier: pkg.tier,
    type: pkg.type,
    priceMonthly: pkg.price?.monthly || 0,
    priceYearly: pkg.price?.yearly || 0,
    limits: pkg.limits,
    isPopular: pkg.isPopular || false,
    isCurrent: pkg.tier === userPlan.plan,
  }));

  return <BillingClient plan={serialize(userPlan)} plans={serialize(plans)} />;
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <BillingData />
    </Suspense>
  );
}
