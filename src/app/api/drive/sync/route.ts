import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import { getGoogleToken, uploadToDrive } from "@/lib/google-drive";

// POST /api/drive/sync — upload all receipt images to Google Drive
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = await getGoogleToken(session.userId);
  if (!token) return NextResponse.json({ error: "Google Drive ยังไม่เชื่อมต่อ" }, { status: 400 });

  await connectDB();

  // Find receipts with images that haven't been synced to Drive
  const receipts = await Receipt.find({
    userId: session.userId,
    imageUrl: { $exists: true, $ne: "" },
    driveFileId: { $exists: false },
  }).select("merchant date imageUrl").limit(10).lean();

  let uploaded = 0;
  let failed = 0;

  for (const r of receipts) {
    const imageUrl = (r as any).imageUrl;
    if (!imageUrl) continue;

    const merchant = (r as any).merchant || "receipt";
    const date = (r as any).date ? new Date((r as any).date).toISOString().slice(0, 10) : "unknown";
    const fileName = `${merchant}_${date}.jpg`;

    try {
      const result = await uploadToDrive(token, fileName, "image/jpeg", imageUrl);
      if (result) {
        await Receipt.findByIdAndUpdate(r._id, {
          driveFileId: result.id,
          driveLink: result.webViewLink,
        });
        uploaded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    total: receipts.length,
    uploaded,
    failed,
    remaining: await Receipt.countDocuments({
      userId: session.userId,
      imageUrl: { $exists: true, $ne: "" },
      driveFileId: { $exists: false },
    }),
  });
}
