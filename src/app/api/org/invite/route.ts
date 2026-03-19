import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Organization from "@/models/Organization";
import crypto from "crypto";

// GET — get invite link for current org
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDB();
  const org = await Organization.findById(session.orgId);
  if (!org) return NextResponse.json({ error: "ไม่พบบริษัท" }, { status: 404 });

  // Generate invite code if not exists
  if (!org.inviteCode) {
    org.inviteCode = crypto.randomBytes(6).toString("hex");
    await org.save();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://iped.codelabdev.co";
  return NextResponse.json({
    inviteCode: org.inviteCode,
    inviteUrl: `${baseUrl}/join/${org.inviteCode}`,
    orgName: org.name,
  });
}

// POST — create new invite code (regenerate)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDB();
  const org = await Organization.findById(session.orgId);
  if (!org) return NextResponse.json({ error: "ไม่พบบริษัท" }, { status: 404 });

  org.inviteCode = crypto.randomBytes(6).toString("hex");
  await org.save();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://iped.codelabdev.co";
  return NextResponse.json({
    inviteCode: org.inviteCode,
    inviteUrl: `${baseUrl}/join/${org.inviteCode}`,
    orgName: org.name,
  });
}
