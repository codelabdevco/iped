import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Budget from "@/models/Budget";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: body },
      { new: true }
    ).lean();

    if (!budget) return apiError("ไม่พบงบประมาณ", 404);
    return apiSuccess({ budget: { ...budget, _id: String(budget._id) } });
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (session: JWTPayload) => {
    const { id } = await params;
    await connectDB();

    const budget = await Budget.findOneAndDelete({ _id: id, userId: session.userId });
    if (!budget) return apiError("ไม่พบงบประมาณ", 404);
    return apiSuccess({ deleted: true });
  });
}
