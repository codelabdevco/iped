import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session) => {
    await connectDB();
    const { id } = await params;
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      return NextResponse.json({ success: false, error: "" }, { status: 404 });
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
      "imageUrl", "time", "items",
    ];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    // Only force "edited" if status wasn't explicitly set
    if (!body.status) updateData.status = "edited";
    const receipt = await Receipt.findByIdAndUpdate(id, updateData, { new: true });
    if (!receipt) {
      return NextResponse.json({ success: false, error: "" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: receipt });
  });
}
