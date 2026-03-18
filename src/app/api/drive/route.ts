import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGoogleToken, listDriveFiles, uploadToDrive } from "@/lib/google-drive";

// GET /api/drive — list files in iPED folder
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = await getGoogleToken(session.userId);
  if (!token) return NextResponse.json({ error: "Google Drive ยังไม่เชื่อมต่อ", connected: false }, { status: 400 });

  try {
    const files = await listDriveFiles(token);
    return NextResponse.json({ connected: true, files });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/drive — upload file to iPED folder
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = await getGoogleToken(session.userId);
  if (!token) return NextResponse.json({ error: "Google Drive ยังไม่เชื่อมต่อ" }, { status: 400 });

  const body = await request.json();
  const { fileName, mimeType, data } = body;
  if (!fileName || !data) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  try {
    const result = await uploadToDrive(token, fileName, mimeType || "image/jpeg", data);
    if (result) return NextResponse.json({ success: true, ...result });
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
