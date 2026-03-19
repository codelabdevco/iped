import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError, getPagination } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Receipt from "@/models/Receipt";
import User from "@/models/User";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeString, validateNumber } from "@/lib/validate";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPagination(req);

    const filter: Record<string, unknown> = {
      userId: session.userId,
      accountType: session.accountType || "personal",
    };

    const category = searchParams.get("category");
    if (category) filter.category = category;

    const status = searchParams.get("status");
    if (status) filter.status = status;

    const [receipts, total] = await Promise.all([
      Receipt.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Receipt.countDocuments(filter),
    ]);

    // Stats
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const modeFilter = { userId: session.userId, accountType: session.accountType || "personal" };
    const [todayStats, monthStats] = await Promise.all([
      Receipt.aggregate([
        { $match: { ...modeFilter, date: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Receipt.aggregate([
        { $match: { ...modeFilter, date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const user = await User.findById(session.userId).select("monthlyBudget").lean() as { monthlyBudget?: number } | null;

    const stats = {
      totalToday: todayStats[0]?.total || 0,
      totalMonth: monthStats[0]?.total || 0,
      countToday: todayStats[0]?.count || 0,
      countMonth: monthStats[0]?.count || 0,
      budget: user?.monthlyBudget ?? 50000,
    };

    return NextResponse.json({
      receipts: receipts.map((r) => ({ ...r, _id: String(r._id) })),
      stats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();

    // Rate limit: 30 receipt creates per minute per user
    const rl = checkRateLimit(`receipts:${session.userId}`, 30, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests, please wait" }, { status: 429 });
    }

    // Quota check
    const { checkQuota, incrementUsage } = await import("@/lib/quota");
    const quota = await checkQuota(session.userId, "receipts");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.message, quota: { current: quota.current, limit: quota.limit, plan: quota.plan } }, { status: 402 });
    }

    const body = await req.json();

    if (!body.merchant || !body.date || body.amount == null) {
      return apiError("กรุณากรอก merchant, date, amount", 400);
    }

    // Sanitize and validate inputs
    body.merchant = sanitizeString(body.merchant, 200);
    body.note = sanitizeString(body.note || "", 1000);
    const amtErr = validateNumber(body.amount, "amount", { min: 0, max: 999999999 });
    if (amtErr) return apiError(amtErr, 400);

    // Check for duplicate by imageHash
    if (body.imageHash) {
      const dup = await Receipt.findOne({ imageHash: body.imageHash, userId: session.userId }).lean();
      if (dup) {
        return NextResponse.json(
          {
            error: "ใบเสร็จนี้อาจซ้ำ",
            duplicate: true,
            duplicateInfo: `เคยบันทึก ${dup.merchant} เมื่อ ${new Date(dup.createdAt).toLocaleDateString("th-TH")}`,
            existingId: String(dup._id),
          },
          { status: 409 }
        );
      }
    }

    const receipt = await Receipt.create({
      ...body,
      userId: session.userId,
      source: body.source || "web",
      status: body.status || "confirmed",
      accountType: session.accountType || "personal",
    });

    // Track usage
    await incrementUsage(session.userId, "receipts");

    return NextResponse.json({ success: true, receipt: { ...receipt.toObject(), _id: String(receipt._id) } }, { status: 201 });
  });
}
