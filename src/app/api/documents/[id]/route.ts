import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import { logDocumentAction } from "@/lib/audit";
import DocumentModel from "@/models/Document";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (session: JWTPayload) => {
    const { id } = await params;
    await connectDB();
    const doc = await DocumentModel.findOne({ _id: id, userId: session.userId }).lean();
    if (!doc) return apiError("ไม่พบเอกสาร", 404);
    return apiSuccess({ document: doc });
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const doc = await DocumentModel.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: { ...body, updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!doc) return apiError("ไม่พบเอกสาร", 404);

    await logDocumentAction("update", `Updated document ${id}`, session.userId, id, { fields: Object.keys(body) });
    return apiSuccess({ document: doc });
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (session: JWTPayload) => {
    const { id } = await params;
    await connectDB();

    const doc = await DocumentModel.findOneAndDelete({ _id: id, userId: session.userId });
    if (!doc) return apiError("ไม่พบเอกสาร", 404);

    await logDocumentAction("delete", `Deleted document ${id}`, session.userId, id);
    return apiSuccess({ deleted: true });
  });
}
