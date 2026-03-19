import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAdmin, apiSuccess, apiError } from "@/lib/api-helpers";
import Subscription from "@/models/Subscription";
import Package from "@/models/Package";
import User from "@/models/User";
import Usage from "@/models/Usage";

// GET /api/admin/subscriptions — list all subscriptions with user + package info
export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    await connectDB();

    const [subs, packages, users] = await Promise.all([
      Subscription.find().populate("packageId").sort({ createdAt: -1 }).lean(),
      Package.find({ status: "active" }).sort({ sortOrder: 1 }).lean(),
      User.find().select("name lineDisplayName email lineUserId").lean(),
    ]);

    const now = new Date();
    const userMap: Record<string, any> = {};
    users.forEach((u: any) => { userMap[String(u._id)] = u; });

    const data = subs.map((s: any) => {
      const user = userMap[s.userId] || {};
      return {
        _id: String(s._id),
        userId: s.userId,
        userName: user.lineDisplayName || user.name || "ไม่ระบุ",
        userEmail: user.email || "",
        packageName: s.packageId?.name || "Free",
        packageTier: s.packageId?.tier || "free",
        status: s.status,
        billingCycle: s.billingCycle,
        currentPeriodEnd: s.currentPeriodEnd,
        trialEnd: s.trialEnd,
        autoRenew: s.autoRenew,
        createdAt: s.createdAt,
      };
    });

    const stats = {
      total: subs.length,
      active: subs.filter((s: any) => s.status === "active").length,
      trial: subs.filter((s: any) => s.status === "trial").length,
      free: subs.filter((s: any) => (s.packageId as any)?.tier === "free").length,
      paid: subs.filter((s: any) => (s.packageId as any)?.tier !== "free").length,
    };

    return apiSuccess({
      subscriptions: data,
      packages: packages.map((p: any) => ({ _id: String(p._id), name: p.name, tier: p.tier })),
      stats,
    });
  });
}

// PUT /api/admin/subscriptions — change a user's package
export async function PUT(request: NextRequest) {
  return withAdmin(request, async (session, req) => {
    await connectDB();
    const { userId, packageTier, status, billingCycle } = await req.json();

    if (!userId) return apiError("userId required", 400);

    const pkg = packageTier ? await Package.findOne({ tier: packageTier }).lean() as any : null;

    const update: any = {};
    if (pkg) update.packageId = pkg._id;
    if (status) update.status = status;
    if (billingCycle) update.billingCycle = billingCycle;

    if (pkg) {
      const now = new Date();
      const periodEnd = new Date(now);
      if (billingCycle === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
      update.currentPeriodStart = now;
      update.currentPeriodEnd = periodEnd;
    }

    const sub = await Subscription.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true }
    ).populate("packageId").lean() as any;

    // Also update User.packageId for backward compat
    if (pkg) {
      await User.findByIdAndUpdate(userId, { packageId: pkg._id, packageExpiry: update.currentPeriodEnd });
    }

    return apiSuccess({
      subscription: {
        ...sub,
        _id: String(sub._id),
        packageName: sub.packageId?.name,
        packageTier: sub.packageId?.tier,
      },
    });
  });
}
