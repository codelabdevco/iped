import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";

// GET /api/receipts/company-slip?id=xxx — returns company slip image
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    await connectDB();
    const receipt = await Receipt.findById(id).select("companySlipImage userId").lean() as any;
    if (!receipt) return NextResponse.json({ error: "not found" }, { status: 404 });

    const dataUrl = receipt.companySlipImage as string;
    if (!dataUrl) return NextResponse.json({ error: "no slip" }, { status: 404 });

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return NextResponse.json({ error: "invalid format" }, { status: 404 });

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
