import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Match from "@/models/Match";
import Receipt from "@/models/Receipt";

// GET /api/matches — list matches with receipt details
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    await connectDB();
    const matches = await Match.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Enrich with receipt data
    const receiptIds = new Set<string>();
    matches.forEach((m: any) => { receiptIds.add(m.receiptA); receiptIds.add(m.receiptB); });

    const receipts = await Receipt.find({ _id: { $in: Array.from(receiptIds) } })
      .select("merchant amount date category status source")
      .lean();

    const receiptMap: Record<string, any> = {};
    receipts.forEach((r: any) => { receiptMap[String(r._id)] = { merchant: r.merchant, amount: r.amount, date: r.date, category: r.category, status: r.status, source: r.source }; });

    const enriched = matches.map((m: any) => ({
      _id: String(m._id),
      receiptA: { _id: m.receiptA, ...receiptMap[m.receiptA] },
      receiptB: { _id: m.receiptB, ...receiptMap[m.receiptB] },
      matchScore: m.matchScore,
      matchType: m.matchType,
      matchReason: m.matchReason,
      status: m.status,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ matches: enriched });
  } catch (error) {
    console.error("Matches GET Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการโหลดข้อมูลการจับคู่" }, { status: 500 });
  }
}

// PUT /api/matches — update match status
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "กรุณาระบุ id และ status" }, { status: 400 });

    await connectDB();
    await Match.findOneAndUpdate({ _id: id, userId: session.userId }, { status });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Matches PUT Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตสถานะการจับคู่" }, { status: 500 });
  }
}
