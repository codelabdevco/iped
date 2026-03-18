import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FileModel from "@/models/File";

// GET — list files (metadata only, no data)
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await connectDB();
  const files = await FileModel.find({ userId: session.userId })
    .select("-data")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return NextResponse.json({ files: files.map((f: any) => ({ ...f, _id: String(f._id) })) });
}

// POST — upload file
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const category = formData.get("category") as string || "";
  const note = formData.get("note") as string || "";

  if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป (สูงสุด 15MB)" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  await connectDB();
  const doc = await FileModel.create({
    name: file.name,
    type: file.type,
    size: file.size,
    data: dataUrl,
    category,
    note,
    userId: session.userId,
  });

  return NextResponse.json({ success: true, file: { _id: String(doc._id), name: doc.name, type: doc.type, size: doc.size } }, { status: 201 });
}

// DELETE — delete file
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await connectDB();
  await FileModel.deleteOne({ _id: id, userId: session.userId });
  return NextResponse.json({ success: true });
}
