import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api-helpers";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";

// POST /api/receipts/transfer — transfer receipts between personal/business
export async function POST(request: NextRequest) {
  return withAuth(request, async (session, req) => {
    await connectDB();
    const body = await req.json();
    const { ids, targetMode } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return apiError("กรุณาเลือกรายการที่ต้องการส่งต่อ", 400);
    }
    if (targetMode !== "personal" && targetMode !== "business") {
      return apiError("โหมดปลายทางไม่ถูกต้อง", 400);
    }

    const result = await Receipt.updateMany(
      { _id: { $in: ids }, userId: session.userId },
      { $set: { accountType: targetMode } }
    );

    return NextResponse.json({
      success: true,
      transferred: result.modifiedCount,
      targetMode,
    });
  });
}
