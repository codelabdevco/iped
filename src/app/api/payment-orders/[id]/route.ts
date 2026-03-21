import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload, canViewAdmin } from "@/lib/auth";
import PaymentOrder from "@/models/PaymentOrder";
import Subscription from "@/models/Subscription";
import Package from "@/models/Package";
import User from "@/models/User";
import { logger } from "@/lib/logger";

// GET — get slip image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { id } = await params;
    const order = await PaymentOrder.findById(id).select("slipImage userId").lean() as any;
    if (!order) return apiError("ไม่พบรายการ", 404);

    const user = await User.findById(session.userId).select("role").lean() as any;
    if (!canViewAdmin(user?.role) && order.userId !== session.userId) return apiError("Unauthorized", 403);

    return apiSuccess({ slipImage: order.slipImage || "" });
  });
}

// PUT — approve or reject (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const user = await User.findById(session.userId).select("role").lean() as any;
    if (!canViewAdmin(user?.role || session.role)) return apiError("Admin only", 403);

    const order = await PaymentOrder.findById(id) as any;
    if (!order) return apiError("ไม่พบรายการ", 404);
    if (order.status !== "pending") return apiError("รายการนี้ดำเนินการแล้ว", 400);

    if (body.action === "approve") {
      // Activate subscription
      const pkg = await Package.findById(order.packageId).lean() as any;
      if (!pkg) return apiError("ไม่พบแพ็กเกจ", 404);

      const now = new Date();
      const periodEnd = new Date(now);
      if (order.billingCycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Upsert subscription
      const subQuery = order.orgId
        ? { orgId: order.orgId }
        : { userId: order.userId, $or: [{ orgId: { $exists: false } }, { orgId: null }, { orgId: "" }] };

      await Subscription.findOneAndUpdate(
        subQuery,
        {
          userId: order.userId,
          orgId: order.orgId || undefined,
          packageId: order.packageId,
          status: "active",
          billingCycle: order.billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          autoRenew: true,
        },
        { upsert: true, new: true }
      );

      order.status = "approved";
      order.approvedBy = session.userId;
      order.approvedAt = new Date();
      await order.save();

      logger.info("Payment approved", { orderId: id, userId: order.userId, package: order.packageTier });

      return apiSuccess({ order: { _id: String(order._id), status: "approved", packageName: order.packageName } });
    }

    if (body.action === "reject") {
      order.status = "rejected";
      order.rejectedReason = body.reason || "";
      await order.save();

      logger.info("Payment rejected", { orderId: id, reason: body.reason });

      return apiSuccess({ order: { _id: String(order._id), status: "rejected" } });
    }

    return apiError("action ต้องเป็น approve หรือ reject", 400);
  });
}
