import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Match from "@/models/Match";

// POST /api/matches/manual — create a manual match between two receipts
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await connectDB();
  const { receiptA, receiptB } = await request.json();

  if (!receiptA || !receiptB) {
    return NextResponse.json({ error: "กรุณาเลือกเอกสาร 2 รายการ" }, { status: 400 });
  }

  if (receiptA === receiptB) {
    return NextResponse.json({ error: "ไม่สามารถจับคู่เอกสารเดียวกันได้" }, { status: 400 });
  }

  // Check if already matched
  const existing = await Match.findOne({
    $or: [
      { receiptA, receiptB },
      { receiptA: receiptB, receiptB: receiptA },
    ],
  });

  if (existing) {
    return NextResponse.json({ error: "เอกสารนี้จับคู่แล้ว", match: existing }, { status: 409 });
  }

  const match = await Match.create({
    receiptA,
    receiptB,
    matchScore: 100,
    matchType: "manual",
    matchReason: "จับคู่ด้วยตนเอง",
    status: "matched",
    userId: session.userId,
  });

  return NextResponse.json({ success: true, match }, { status: 201 });
}
