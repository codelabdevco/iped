import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";

// GET /api/receipts/image?id=xxx — returns actual image binary
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    await connectDB();

    // Find receipt (any accountType — images shared across modes)
    const receipt = await Receipt.findOne({ _id: id, userId: session.userId }).select("imageUrl imageHash").lean() as any;
    if (!receipt?.imageUrl) return NextResponse.json({ error: "not found" }, { status: 404 });

    let dataUrl = receipt.imageUrl as string;

    // If imageUrl is a reference (not base64), follow the imageHash chain
    if (!dataUrl.startsWith("data:") && receipt.imageHash) {
      const original = await Receipt.findOne({
        userId: session.userId,
        imageHash: receipt.imageHash,
        imageUrl: { $regex: /^data:/ },
      }).select("imageUrl").lean() as any;

      if (original?.imageUrl) {
        dataUrl = original.imageUrl;
        // Auto-fix broken reference
        await Receipt.updateOne({ _id: id }, { $set: { imageUrl: dataUrl } });
      } else {
        return NextResponse.json({ error: "image not found" }, { status: 404 });
      }
    }

    // Parse data URL
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return NextResponse.json({ error: "invalid image" }, { status: 404 });

    const buffer = Buffer.from(match[2], "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": match[1],
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  });
}
