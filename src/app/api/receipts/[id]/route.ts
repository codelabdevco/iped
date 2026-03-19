import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import Match from "@/models/Match";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session) => {
    await connectDB();
    const { id } = await params;
    const receipt = await Receipt.findOne({ _id: id, userId: session.userId });
    if (!receipt) {
      return NextResponse.json({ success: false, error: "ไม่พบใบเสร็จที่ต้องการ" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: receipt });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session) => {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const allowedFields = [
      "merchant", "amount", "date", "category", "categoryIcon",
      "subCategory", "paymentMethod", "vat", "wht", "note",
      "documentNumber", "merchantTaxId", "type", "status",
      "imageUrl", "time", "items", "direction", "fileIds", "accountType",
    ];
    // Check if this is a transferred receipt (read-only except status changes)
    const existing = await Receipt.findOne({ _id: id, userId: session.userId });
    if (!existing) {
      return NextResponse.json({ success: false, error: "ไม่พบใบเสร็จที่ต้องการแก้ไข" }, { status: 404 });
    }
    const isTransferred = (existing.note || "").includes("ค่าใช้จ่ายบริษัท จากส่วนตัว");
    if (isTransferred && !body.status) {
      return NextResponse.json({ success: false, error: "ใบเสร็จที่ส่งมาจากส่วนตัวไม่สามารถแก้ไขได้ สามารถเปลี่ยนสถานะได้เท่านั้น" }, { status: 403 });
    }

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    // Only force "edited" if status wasn't explicitly set
    if (!body.status) updateData.status = "edited";
    const receipt = await Receipt.findOneAndUpdate({ _id: id, userId: session.userId }, updateData, { new: true });
    if (!receipt) {
      return NextResponse.json({ success: false, error: "ไม่พบใบเสร็จที่ต้องการแก้ไข" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: receipt });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session) => {
    await connectDB();
    const { id } = await params;
    const receipt = await Receipt.findOneAndDelete({ _id: id, userId: session.userId });
    if (!receipt) {
      return NextResponse.json({ success: false, error: "ไม่พบใบเสร็จที่ต้องการลบ" }, { status: 404 });
    }
    // Cascade: remove related matches
    await Match.deleteMany({
      userId: session.userId,
      $or: [{ receiptA: id }, { receiptB: id }],
    });
    return NextResponse.json({ success: true, deleted: id });
  });
}
