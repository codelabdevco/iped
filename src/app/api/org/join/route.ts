import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Organization from "@/models/Organization";
import User from "@/models/User";

// POST — join org by invite code
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { inviteCode } = await request.json();
  if (!inviteCode) return NextResponse.json({ error: "ไม่พบรหัสเชิญ" }, { status: 400 });

  await connectDB();

  const org = await Organization.findOne({ inviteCode, status: "active" });
  if (!org) return NextResponse.json({ error: "รหัสเชิญไม่ถูกต้องหรือหมดอายุ" }, { status: 404 });

  // Check if already a member
  const isMember = org.members?.some((m: any) => String(m.userId) === session.userId);
  if (isMember) {
    return NextResponse.json({ success: true, already: true, orgName: org.name, message: "คุณเป็นสมาชิกอยู่แล้ว" });
  }

  // Add as member (viewer role by default)
  org.members = org.members || [];
  org.members.push({ userId: session.userId, role: "viewer", joinedAt: new Date() });
  await org.save();

  // Update user's orgId
  await User.findByIdAndUpdate(session.userId, { orgId: org._id, accountType: "personal" });

  return NextResponse.json({
    success: true,
    orgName: org.name,
    message: `เข้าร่วม ${org.name} เรียบร้อยแล้ว`,
  });
}

// GET — check org info by invite code
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "ไม่พบรหัส" }, { status: 400 });

  await connectDB();
  const org = await Organization.findOne({ inviteCode: code, status: "active" }).select("name type members").lean();
  if (!org) return NextResponse.json({ error: "ไม่พบบริษัท" }, { status: 404 });

  return NextResponse.json({
    orgName: (org as any).name,
    orgType: (org as any).type,
    memberCount: (org as any).members?.length || 0,
  });
}
