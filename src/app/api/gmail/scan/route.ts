import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import { processOCR } from "@/lib/ocr";
import { findMatches } from "@/lib/auto-match";
import crypto from "crypto";

// POST /api/gmail/scan — scan Gmail for receipts
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId).select("googleAccessToken googleEmail").lean();
  if (!(user as any)?.googleAccessToken) {
    return NextResponse.json({ error: "ยังไม่ได้เชื่อมต่อ Gmail กรุณาเชื่อมต่อก่อน" }, { status: 400 });
  }

  const accessToken = (user as any).googleAccessToken;

  try {
    // Search for receipt-related emails (last 30 days)
    const query = encodeURIComponent("subject:(ใบเสร็จ OR receipt OR invoice OR payment OR สลิป OR โอนเงิน) newer_than:30d has:attachment");
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (listRes.status === 401) {
      // Token expired — need to re-auth
      return NextResponse.json({ error: "Token หมดอายุ กรุณาเชื่อมต่อ Gmail ใหม่", expired: true }, { status: 401 });
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    const results: { subject: string; from: string; date: string; status: string; receiptId?: string }[] = [];

    for (const msg of messages.slice(0, 5)) {
      // Get message details
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "ไม่มีหัวข้อ";
      const from = headers.find((h: any) => h.name === "From")?.value || "";
      const dateStr = headers.find((h: any) => h.name === "Date")?.value || "";

      // Find image attachments
      const parts = msgData.payload?.parts || [];
      let processed = false;

      for (const part of parts) {
        if (part.mimeType?.startsWith("image/") && part.body?.attachmentId) {
          // Download attachment
          const attRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${part.body.attachmentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const attData = await attRes.json();
          if (!attData.data) continue;

          // Convert from URL-safe base64
          const base64 = attData.data.replace(/-/g, "+").replace(/_/g, "/");
          const imageHash = crypto.createHash("sha256").update(base64.slice(0, 1000)).digest("hex").slice(0, 16);

          // Check duplicate
          const existing = await Receipt.findOne({ imageHash, userId: session.userId });
          if (existing) {
            results.push({ subject, from, date: dateStr, status: "duplicate" });
            processed = true;
            break;
          }

          // OCR
          try {
            const ocrResult = await processOCR(base64, part.mimeType);
            const receipt = await Receipt.create({
              merchant: ocrResult.merchant,
              date: ocrResult.date || new Date(),
              time: ocrResult.time,
              amount: ocrResult.amount || 0,
              category: ocrResult.category,
              categoryIcon: ocrResult.categoryIcon,
              type: ocrResult.type || "receipt",
              paymentMethod: ocrResult.paymentMethod,
              source: "email",
              status: "pending",
              imageUrl: `data:${part.mimeType};base64,${base64}`,
              imageHash,
              ocrConfidence: (ocrResult.ocrConfidence || 0) / 100,
              ocrRawText: ocrResult.ocrRawText,
              userId: session.userId,
              note: `จาก email: ${subject}`,
            });

            // Auto-match
            await findMatches(String(receipt._id), session.userId);

            // Auto-sync to Google Drive
            try {
              const { getGoogleToken, uploadToDrive } = await import("@/lib/google-drive");
              const driveToken = await getGoogleToken(session.userId);
              if (driveToken) {
                const fileName = `${ocrResult.merchant}_${ocrResult.date || "unknown"}.jpg`;
                const driveResult = await uploadToDrive(driveToken, fileName, part.mimeType, base64);
                if (driveResult) {
                  await Receipt.findByIdAndUpdate(receipt._id, { driveFileId: driveResult.id, driveLink: driveResult.webViewLink });
                }
              }
            } catch (driveErr) { console.error("Drive sync error:", driveErr); }

            results.push({ subject, from, date: dateStr, status: "saved", receiptId: String(receipt._id) });
            processed = true;
            break;
          } catch (e) {
            results.push({ subject, from, date: dateStr, status: "ocr_failed" });
            processed = true;
            break;
          }
        }
      }

      if (!processed) {
        results.push({ subject, from, date: dateStr, status: "no_attachment" });
      }
    }

    return NextResponse.json({
      success: true,
      scanned: messages.length,
      results,
    });
  } catch (err: any) {
    console.error("Gmail scan error:", err.message);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสแกน Gmail" }, { status: 500 });
  }
}
