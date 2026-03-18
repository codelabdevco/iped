import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";

// GET /api/receipts/image?id=xxx — returns actual image binary
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await connectDB();
  const receipt = await Receipt.findOne({ _id: id, userId: session.userId }).select("imageUrl").lean() as any;
  if (!receipt?.imageUrl) return NextResponse.json({ error: "not found" }, { status: 404 });

  const dataUrl = receipt.imageUrl as string;

  // Parse data URL: "data:image/jpeg;base64,XXXXX"
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    // Fallback: return as JSON for backward compat
    return NextResponse.json({ imageUrl: dataUrl });
  }

  const mimeType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
