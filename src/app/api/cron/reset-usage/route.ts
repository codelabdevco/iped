import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Usage from "@/models/Usage";

// GET /api/cron/reset-usage — Monthly cleanup of old usage records
// Protected by CRON_SECRET header. Run on 1st of each month.
// Note: Usage model auto-creates new month entries, so no reset needed.
// This just cleans up records older than 12 months.
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await connectDB();

  const currentYear = new Date().getFullYear();

  // Delete usage records older than 12 months (previous year and older)
  const result = await Usage.deleteMany({ year: { $lt: currentYear - 1 } });

  return NextResponse.json({
    success: true,
    deleted: result.deletedCount,
    message: `Cleaned up ${result.deletedCount} old usage records (year < ${currentYear - 1})`,
  });
}
