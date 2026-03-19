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
      ? "เบิกจ่ายจากส่วนตัว"
      : "โอนจากบริษัท";
    const noteUpdate = direction === "to-business"
      ? "ส่งเบิกจ่ายแล้ว"
      : "โอนกลับส่วนตัวแล้ว";

    // Find original receipt
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

    // Create a copy as reimbursement request
    const newReceipt = await Receipt.create({
      type: original.type,
      source: original.source,
      documentNumber: original.documentNumber,
      merchant: original.merchant,
      merchantTaxId: original.merchantTaxId,
      date: original.date,
      time: original.time,
      dueDate: original.dueDate,
      amount: original.amount,
      vat: original.vat,
      wht: original.wht,
      category: original.category,
      categoryIcon: original.categoryIcon,
      subCategory: original.subCategory,
      paymentMethod: original.paymentMethod,
      imageUrl: original.imageUrl,
      imageHash: original.imageHash,
      fileIds: original.fileIds,
      lineItems: original.lineItems,
      userId: session.userId,
      orgId: original.orgId,
      accountType: targetAccountType,
      status: "pending",
      direction: "expense",
      note: `${notePrefix} • ref: ${original._id}`,
    });

    // Update original receipt with reference
    const existingNote = original.note ? `${original.note} | ` : "";
    await Receipt.findByIdAndUpdate(original._id, {
      note: `${existingNote}${noteUpdate} • ref: ${newReceipt._id}`,
    });

    return NextResponse.json({ success: true, data: newReceipt });
  });
}
