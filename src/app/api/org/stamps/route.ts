import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Organization from "@/models/Organization";

// GET — get stamp + signature
export async function GET() {
  const session = await getSession();
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const org = await Organization.findById(session.orgId)
    .select("stampImage signatureImage signatureName signaturePosition name")
    .lean() as any;

  return NextResponse.json({
    stampImage: org?.stampImage || "",
    signatureImage: org?.signatureImage || "",
    signatureName: org?.signatureName || "",
    signaturePosition: org?.signaturePosition || "",
    orgName: org?.name || "",
  });
}

// PUT — update stamp/signature
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await connectDB();

  const update: Record<string, unknown> = {};
  if (body.stampImage !== undefined) update.stampImage = body.stampImage;
  if (body.signatureImage !== undefined) update.signatureImage = body.signatureImage;
  if (body.signatureName !== undefined) update.signatureName = body.signatureName;
  if (body.signaturePosition !== undefined) update.signaturePosition = body.signaturePosition;

  await Organization.findByIdAndUpdate(session.orgId, { $set: update });

  return NextResponse.json({ success: true });
}
