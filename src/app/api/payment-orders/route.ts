import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload, canViewAdmin } from "@/lib/auth";
import PaymentOrder from "@/models/PaymentOrder";
import Package from "@/models/Package";
import User from "@/models/User";

// GET — list payment orders (admin: all, user: own)
export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const user = await User.findById(session.userId).select("role").lean() as any;
    const isAdmin = canViewAdmin(user?.role || session.role);

    const query = isAdmin ? {} : { userId: session.userId };
    const orders = await PaymentOrder.find(query).sort({ createdAt: -1 }).limit(100).lean();

    const data = orders.map((o: any) => ({
      _id: String(o._id),
      userId: o.userId,
      orgId: o.orgId || "",
      packageTier: o.packageTier,
      packageName: o.packageName,
      billingCycle: o.billingCycle,
      amount: o.amount,
      hasSlip: !!o.slipImage,
      bankFrom: o.bankFrom || "",
      transferDate: o.transferDate ? new Date(o.transferDate).toISOString() : "",
      transferTime: o.transferTime || "",
      note: o.note || "",
      status: o.status,
      rejectedReason: o.rejectedReason || "",
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : "",
    }));

    return apiSuccess({ orders: data });
  });
}

// POST — create payment order (user submits payment proof)
export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    if (!body.packageId || !body.slipImage) {
      return apiError("กรุณาเลือกแพ็กเกจและแนบสลิปโอนเงิน", 400);
    }

    const pkg = await Package.findById(body.packageId).lean() as any;
    if (!pkg) return apiError("ไม่พบแพ็กเกจ", 404);

    const billingCycle = body.billingCycle || "monthly";
    const amount = billingCycle === "yearly" ? (pkg.yearlyPrice || pkg.monthlyPrice * 10) : pkg.monthlyPrice;

    // Check for existing pending order
    const existing = await PaymentOrder.findOne({ userId: session.userId, status: "pending" });
    if (existing) return apiError("คุณมีรายการรอตรวจสอบอยู่แล้ว กรุณารอ admin อนุมัติ", 400);

    const order = await PaymentOrder.create({
      userId: session.userId,
      orgId: body.orgId || session.orgId || undefined,
      packageId: body.packageId,
      packageTier: pkg.tier,
      packageName: pkg.name,
      billingCycle,
      amount,
      slipImage: body.slipImage,
      bankFrom: body.bankFrom || "",
      transferDate: body.transferDate ? new Date(body.transferDate) : new Date(),
      transferTime: body.transferTime || "",
      note: body.note || "",
      status: "pending",
    });

    return apiSuccess({ order: { _id: String(order._id), status: "pending", packageName: pkg.name, amount } }, 201);
  });
}
