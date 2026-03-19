import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session) => {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { direction } = body;

    if (!direction || !["to-business", "to-personal"].includes(direction)) {
      return NextResponse.json(
        { success: false, error: "direction ต้องเป็น 'to-business' หรือ 'to-personal'" },
        { status: 400 }
      );
    }

    const sourceAccountType = direction === "to-business" ? "personal" : "business";
    const targetAccountType = direction === "to-business" ? "business" : "personal";
    const notePrefix = direction === "to-business"
      ? "ค่าใช้จ่ายบริษัท จากส่วนตัว"
      : "โอนจากบริษัท";
    const noteUpdate = direction === "to-business"
      ? "ส่งเป็นค่าใช้จ่ายบริษัทแล้ว"
      : "โอนกลับส่วนตัวแล้ว";

    // Find original receipt — NO .select() so we get ALL fields including imageUrl
    const original = await Receipt.findOne({
      _id: id,
      userId: session.userId,
      accountType: sourceAccountType,
    });

    if (!original) {
      return NextResponse.json(
        { success: false, error: "ไม่พบใบเสร็จต้นทาง" },
        { status: 404 }
      );
    }

    // Copy ALL data from original to new receipt
    const origObj = original.toObject();
    delete origObj._id;
    delete origObj.createdAt;
    delete origObj.updatedAt;
    delete origObj.__v;

    const newReceipt = await Receipt.create({
      ...origObj,
      userId: session.userId,
      accountType: targetAccountType,
      status: "pending",
      note: `${notePrefix} • ref: ${original._id}`,
    });

    // Update original with reference
    const existingNote = original.note ? `${original.note} | ` : "";
    await Receipt.findByIdAndUpdate(original._id, {
      note: `${existingNote}${noteUpdate} • ref: ${newReceipt._id}`,
    });

    return NextResponse.json({ success: true, data: newReceipt });
  });
}
