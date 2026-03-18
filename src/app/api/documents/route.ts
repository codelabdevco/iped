import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError, getPagination } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import DocumentModel from "@/models/Document";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPagination(req);

    // Build filter
    const filter: Record<string, unknown> = { userId: session.userId };

    const type = searchParams.get("type");
    if (type) filter.type = type;

    const category = searchParams.get("category");
    if (category) filter.category = category;

    const status = searchParams.get("status");
    if (status) filter.status = status;

    const direction = searchParams.get("direction");
    if (direction) filter.direction = direction;

    const source = searchParams.get("source");
    if (source) filter.source = source;

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>).$gte = new Date(from);
      if (to) (filter.date as Record<string, unknown>).$lte = new Date(to + "T23:59:59.999Z");
    }

    const search = searchParams.get("search");
    if (search) {
      filter.$text = { $search: search };
    }

    const [documents, total] = await Promise.all([
      DocumentModel.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      DocumentModel.countDocuments(filter),
    ]);

    // Stats for filtered results
    const statsAgg = await DocumentModel.aggregate([
      { $match: { userId: session.userId, ...(direction ? { direction } : {}) } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalVat: { $sum: { $ifNull: ["$vat", 0] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = statsAgg[0] || { totalAmount: 0, totalVat: 0, count: 0 };

    return apiSuccess({
      documents: documents.map((d) => ({ ...d, _id: String(d._id) })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalAmount: stats.totalAmount,
        totalVat: stats.totalVat,
        count: stats.count,
      },
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    // Validate required fields
    if (!body.merchant || !body.date || !body.amount) {
      return apiError("กรุณากรอก merchant, date, amount", 400);
    }

    // Calculate netAmount
    const amount = Number(body.amount);
    const vat = Number(body.vat || 0);
    const wht = Number(body.wht || 0);
    const netAmount = amount + vat - wht;

    const doc = await DocumentModel.create({
      ...body,
      amount,
      vat: vat || undefined,
      wht: wht || undefined,
      netAmount,
      userId: session.userId,
      source: body.source || "web",
      direction: body.direction || "expense",
      status: body.status || "confirmed",
      accountType: session.accountType || "personal",
    });

    return apiSuccess({ document: { ...doc.toObject(), _id: String(doc._id) } }, 201);
  });
}
