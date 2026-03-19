import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Package from "@/models/Package";

export async function GET() {
  await connectDB();

  const packages = await Package.find({ status: "active" })
    .sort({ sortOrder: 1 })
    .lean();

  return NextResponse.json({ packages });
}
