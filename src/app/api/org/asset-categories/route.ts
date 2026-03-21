import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Organization from "@/models/Organization";

// GET — list asset categories
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const org = await Organization.findById(session.orgId).select("assetCategories").lean() as any;
  if (!org) return NextResponse.json({ assetCategories: [] });

  return NextResponse.json({
    assetCategories: org.assetCategories || [],
  });
}

// POST — add asset category
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.orgId) return NextResponse.json({ error: "ต้องมีองค์กรก่อน" }, { status: 400 });

  const { name, icon, description } = await request.json();
  if (!name) return NextResponse.json({ error: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 });

  await connectDB();
  await Organization.findByIdAndUpdate(session.orgId, {
    $push: { assetCategories: { name: name.trim(), icon: icon?.trim() || "", description: description?.trim() || "" } },
  });

  return NextResponse.json({ success: true });
}

// PUT — update asset category
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, icon, description } = await request.json();
  if (!id || !name) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  await connectDB();
  await Organization.findOneAndUpdate(
    { _id: session.orgId, "assetCategories._id": id },
    { $set: { "assetCategories.$.name": name.trim(), "assetCategories.$.icon": icon?.trim() || "", "assetCategories.$.description": description?.trim() || "" } },
  );

  return NextResponse.json({ success: true });
}

// DELETE — remove asset category
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  await connectDB();
  await Organization.findByIdAndUpdate(session.orgId, { $pull: { assetCategories: { _id: id } } });

  return NextResponse.json({ success: true });
}
