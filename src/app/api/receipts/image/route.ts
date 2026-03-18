import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";

// GET /api/receipts/image?id=xxx — returns imageUrl for a single receipt
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await connectDB();
  const receipt = await Receipt.findOne({ _id: id, userId: session.userId }).select("imageUrl").lean();
  if (!receipt) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ imageUrl: (receipt as any).imageUrl || null });
}
