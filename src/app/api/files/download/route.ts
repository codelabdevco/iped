import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FileModel from "@/models/File";

// GET /api/files/download?id=xxx — returns file data
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await connectDB();
  const file = await FileModel.findOne({ _id: id, userId: session.userId }).lean();
  if (!file) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ data: (file as any).data, name: (file as any).name, type: (file as any).type });
}
