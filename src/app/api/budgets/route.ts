import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Budget from "@/models/Budget";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const budgets = await Budget.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess({
      budgets: budgets.map((b) => ({ ...b, _id: String(b._id) })),
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.amount || !body.type) {
      return apiError("กรุณากรอก name, amount, type", 400);
    }

    const now = new Date();
    let periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (body.period?.start) periodStart = new Date(body.period.start);
    if (body.period?.end) periodEnd = new Date(body.period.end);

    const budget = await Budget.create({
      userId: session.userId,
      name: body.name,
      type: body.type,
      category: body.category,
      amount: body.amount,
      currency: body.currency || "THB",
      period: { start: periodStart, end: periodEnd },
      alerts: body.alerts || { enabled: true, thresholds: [50, 80, 100], sentAlerts: [] },
      autoReset: body.autoReset ?? true,
    });

    return apiSuccess({ budget: { ...budget.toObject(), _id: String(budget._id) } }, 201);
  });
}
