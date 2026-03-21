import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Organization from "@/models/Organization";

// GET — list departments + positions
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const org = await Organization.findById(session.orgId).select("departments positions").lean() as any;
  if (!org) return NextResponse.json({ departments: [], positions: [] });

  return NextResponse.json({
    departments: org.departments || [],
    positions: org.positions || [],
  });
}

// POST — add department or position
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.orgId) return NextResponse.json({ error: "ต้องมีองค์กรก่อน" }, { status: 400 });

  const { type, name, description, level } = await request.json();
  if (!type || !name) return NextResponse.json({ error: "กรุณาระบุชื่อ" }, { status: 400 });

  await connectDB();

  if (type === "department") {
    await Organization.findByIdAndUpdate(session.orgId, {
      $push: { departments: { name: name.trim(), description: description?.trim() || "" } },
    });
  } else if (type === "position") {
    await Organization.findByIdAndUpdate(session.orgId, {
      $push: { positions: { name: name.trim(), level: level || 0 } },
    });
  }

  return NextResponse.json({ success: true });
}

// PUT — update department or position
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id, name, description, level } = await request.json();
  if (!type || !id || !name) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  await connectDB();

  if (type === "department") {
    await Organization.findOneAndUpdate(
      { _id: session.orgId, "departments._id": id },
      { $set: { "departments.$.name": name.trim(), "departments.$.description": description?.trim() || "" } },
    );
  } else if (type === "position") {
    await Organization.findOneAndUpdate(
      { _id: session.orgId, "positions._id": id },
      { $set: { "positions.$.name": name.trim(), "positions.$.level": level || 0 } },
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove department or position
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await request.json();
  if (!type || !id) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  await connectDB();

  if (type === "department") {
    await Organization.findByIdAndUpdate(session.orgId, { $pull: { departments: { _id: id } } });
  } else if (type === "position") {
    await Organization.findByIdAndUpdate(session.orgId, { $pull: { positions: { _id: id } } });
  }

  return NextResponse.json({ success: true });
}
