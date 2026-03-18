import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FileModel from "@/models/File";

// GET /api/files/download?id=xxx — returns actual file binary for download
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await connectDB();
  const file = await FileModel.findOne({ _id: id, userId: session.userId }).lean() as any;
  if (!file) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Convert base64 to binary buffer
  const buffer = Buffer.from(file.data, "base64");
  const filename = encodeURIComponent(file.name || "file");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
