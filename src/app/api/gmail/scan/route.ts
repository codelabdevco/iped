import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import GoogleAccount from "@/models/GoogleAccount";
import Receipt from "@/models/Receipt";
import { processOCR, processEmailBody } from "@/lib/ocr";
import { findMatches } from "@/lib/auto-match";
import FileModel from "@/models/File";
import crypto from "crypto";

// Helper: find attachments recursively (handles nested multipart)
function findAttachments(parts: any[]): { mimeType: string; attachmentId: string; filename: string }[] {
  const attachments: { mimeType: string; attachmentId: string; filename: string }[] = [];
  for (const part of parts) {
    if (part.body?.attachmentId) {
      attachments.push({
        mimeType: part.mimeType || "",
        attachmentId: part.body.attachmentId,
        filename: part.filename || "",
      });
    }
    if (part.parts) {
      attachments.push(...findAttachments(part.parts));
    }
  }
  return attachments;
}

// Helper: parse email date
function parseEmailDate(dateStr: string): Date {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
}

// Helper: extract clean email address from "Name <email>" format
function cleanEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

// Helper: extract HTML/text body from email payload
function getEmailBody(payload: any): string {
  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    return decoded;
  }
  if (payload.parts) {
    // Prefer text/html, fallback to text/plain
    const htmlPart = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      return Buffer.from(htmlPart.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    }
    const textPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    }
    // Check nested parts (multipart/alternative inside multipart/mixed)
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = getEmailBody(part);
        if (nested) return nested;
      }
    }
  }
  return "";
}

// POST /api/gmail/scan — scan Gmail for receipts (all connected accounts)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await connectDB();
  const userId = session.userId;
  const accountType = session.accountType || "personal";

  // Get all connected Google accounts
  const accounts: any[] = await GoogleAccount.find({ userId, status: "active" }).lean();

  // If no accounts, fall back to User model (backward compat)
  if (accounts.length === 0) {
    const user = await User.findById(userId).select("googleAccessToken googleRefreshToken googleEmail").lean() as any;
    if (user?.googleAccessToken) {
      accounts.push({
        _id: "legacy",
        email: user.googleEmail,
        accessToken: user.googleAccessToken,
        refreshToken: user.googleRefreshToken,
      });
    }
  }

  if (accounts.length === 0) {
    return NextResponse.json({ error: "ยังไม่ได้เชื่อมต่อ Gmail กรุณาเชื่อมต่อก่อน" }, { status: 400 });
  }

  const allResults: { subject: string; from: string; date: string; status: string; receiptId?: string; account?: string }[] = [];
  let totalMessages = 0;

  for (const account of accounts) {
    let accessToken = account.accessToken;

    // Try to refresh token if needed
    async function refreshToken(): Promise<string | null> {
      const refreshTok = account.refreshToken;
      if (!refreshTok) return null;
      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            refresh_token: refreshTok,
            grant_type: "refresh_token",
          }),
        });
        const data = await res.json();
        if (data.access_token) {
          if (account._id !== "legacy") {
            await GoogleAccount.findByIdAndUpdate(account._id, { accessToken: data.access_token });
          } else {
            await User.findByIdAndUpdate(userId, { googleAccessToken: data.access_token });
          }
          return data.access_token;
        }
      } catch (e) { console.error("Token refresh error:", e); }
      return null;
    }

    try {
      // Search financial emails (last 90 days) — broad but focused on money-related
      const query = encodeURIComponent("(receipt OR invoice OR payment OR billing OR order OR subscription OR ใบเสร็จ OR สลิป OR โอนเงิน OR ชำระเงิน OR ใบแจ้งหนี้ OR ใบกำกับภาษี OR declined OR refund OR charge OR statement OR confirmation) newer_than:90d");
      let listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Try token refresh on 401
      if (listRes.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          accessToken = newToken;
          listRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        } else {
          // Mark account as expired
          if (account._id !== "legacy") {
            await GoogleAccount.findByIdAndUpdate(account._id, { status: "expired" });
          }
          allResults.push({ subject: `[${account.email}]`, from: account.email, date: "", status: "token_expired", account: account.email });
          continue;
        }
      }

      const listData = await listRes.json();
      const messages = listData.messages || [];
      totalMessages += messages.length;

      const results: { subject: string; from: string; date: string; status: string; receiptId?: string; account?: string }[] = [];

      for (const msg of messages.slice(0, 30)) {
        try {
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
          const emailDate = parseEmailDate(dateStr);
          const messageId = msg.id;

          // Check if this email was already scanned (by Gmail message ID)
          const existingByNote = await Receipt.findOne({
            userId: userId,
            source: "email",
            note: { $regex: messageId },
          });
          if (existingByNote) {
            results.push({ subject, from: cleanEmail(from), date: dateStr, status: "duplicate", account: account.email });
            continue;
          }

          // Find all attachments (images + PDFs)
          const allParts = msgData.payload?.parts || [];
          const attachments = findAttachments(allParts).filter(
            (a) => a.mimeType.startsWith("image/") || a.mimeType === "application/pdf"
          );

          if (attachments.length > 0) {
            // Process first supported attachment
            const att = attachments[0];
            const attRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${att.attachmentId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const attData = await attRes.json();

            if (attData.data) {
              const base64 = attData.data.replace(/-/g, "+").replace(/_/g, "/");
              const imageHash = crypto.createHash("sha256").update(base64.slice(0, 1000)).digest("hex").slice(0, 16);

              // Check duplicate by hash
              const existingByHash = await Receipt.findOne({ imageHash, userId: userId });
              if (existingByHash) {
                results.push({ subject, from: cleanEmail(from), date: dateStr, status: "duplicate", account: account.email });
                continue;
              }

              // OCR
              try {
                const ocrResult = await processOCR(base64, att.mimeType);
                const receipt = await Receipt.create({
                  merchant: ocrResult.merchant || subject,
                  date: ocrResult.date || emailDate,
                  time: ocrResult.time,
                  amount: ocrResult.amount || 0,
                  category: ocrResult.category || "อื่นๆ",
                  categoryIcon: ocrResult.categoryIcon || "📧",
                  type: ocrResult.type || "receipt",
                  paymentMethod: ocrResult.paymentMethod,
                  source: "email",
                  status: "pending",
                  imageUrl: att.mimeType.startsWith("image/") ? `data:${att.mimeType};base64,${base64}` : undefined,
                  imageHash,
                  ocrConfidence: (ocrResult.ocrConfidence || 0) / 100,
                  ocrRawText: ocrResult.ocrRawText,
                  userId: userId,
                  accountType,
                  emailSubject: subject,
                  emailFrom: cleanEmail(from),
                  emailAccount: account.email,
                  note: `gmail:${messageId}`,
                });

                // Save attachment as downloadable file + link to receipt
                try {
                  const savedFile = await FileModel.create({
                    name: att.filename || `${ocrResult.merchant || "receipt"}_${emailDate.toISOString().slice(0, 10)}.${att.mimeType.startsWith("image/") ? "jpg" : "pdf"}`,
                    type: att.mimeType,
                    size: Math.ceil(base64.length * 0.75),
                    data: base64,
                    category: "email-attachment",
                    note: `จาก email: ${subject}`,
                    userId: userId,
                  });
                  await Receipt.findByIdAndUpdate(receipt._id, { $push: { fileIds: String(savedFile._id) } });
                } catch (fileErr) { console.error("File save error:", fileErr); }

                await findMatches(String(receipt._id), userId);

                // Auto-sync to Google Drive
                try {
                  const { getGoogleToken, uploadToDrive } = await import("@/lib/google-drive");
                  const driveToken = await getGoogleToken(userId);
                  if (driveToken) {
                    const fileName = `${ocrResult.merchant || "receipt"}_${emailDate.toISOString().slice(0, 10)}.${att.mimeType.startsWith("image/") ? "jpg" : "pdf"}`;
                    const driveResult = await uploadToDrive(driveToken, fileName, att.mimeType, base64);
                    if (driveResult) {
                      await Receipt.findByIdAndUpdate(receipt._id, { driveFileId: driveResult.id, driveLink: driveResult.webViewLink });
                    }
                  }
                } catch (driveErr) { console.error("Drive sync error:", driveErr); }

                results.push({ subject, from: cleanEmail(from), date: dateStr, status: "saved", receiptId: String(receipt._id), account: account.email });
              } catch (e) {
                // OCR failed — still save the email as a record
                const receipt = await Receipt.create({
                  merchant: subject,
                  date: emailDate,
                  amount: 0,
                  category: "อื่นๆ",
                  categoryIcon: "📧",
                  type: "receipt",
                  source: "email",
                  status: "pending",
                  imageHash,
                  userId: userId,
                  emailSubject: subject,
                  emailFrom: cleanEmail(from),
                  emailAccount: account.email,
                  note: `gmail:${messageId}`,
                });

                // Save attachment even if OCR failed + link to receipt
                try {
                  const savedFile = await FileModel.create({
                    name: att.filename || `attachment_${emailDate.toISOString().slice(0, 10)}.${att.mimeType.startsWith("image/") ? "jpg" : "pdf"}`,
                    type: att.mimeType,
                    size: Math.ceil(base64.length * 0.75),
                    data: base64,
                    category: "email-attachment",
                    note: `จาก email: ${subject}`,
                    userId: userId,
                  });
                  await Receipt.findByIdAndUpdate(receipt._id, { $push: { fileIds: String(savedFile._id) } });
                } catch (fileErr) { console.error("File save error:", fileErr); }

                results.push({ subject, from: cleanEmail(from), date: dateStr, status: "ocr_failed", receiptId: String(receipt._id), account: account.email });
              }
            }
          } else {
            // No supported attachment — analyze email body for receipt data
            const emailBody = getEmailBody(msgData.payload);
            let receiptData: any = {
              merchant: subject,
              date: emailDate,
              amount: 0,
              category: "อื่นๆ",
              categoryIcon: "📧",
              type: "receipt",
              source: "email",
              status: "pending",
              ocrConfidence: 0,
              userId: userId,
              emailSubject: subject,
              emailFrom: cleanEmail(from),
              note: `gmail:${messageId}`,
            };

            if (emailBody.length > 50) {
              try {
                const bodyResult = await processEmailBody(emailBody, subject, cleanEmail(from));
                if (bodyResult.ocrConfidence >= 20) {
                  receiptData = {
                    ...receiptData,
                    merchant: bodyResult.merchant || subject,
                    date: bodyResult.date ? new Date(bodyResult.date) : emailDate,
                    amount: bodyResult.amount || 0,
                    category: bodyResult.category || "อื่นๆ",
                    categoryIcon: bodyResult.categoryIcon || "📧",
                    type: bodyResult.type || "receipt",
                    paymentMethod: bodyResult.paymentMethod,
                    ocrConfidence: bodyResult.ocrConfidence / 100,
                    ocrRawText: bodyResult.ocrRawText,
                  };
                }
              } catch (e) {
                console.error("Email body analysis error:", e);
              }
            }

            const receipt = await Receipt.create(receiptData);
            results.push({
              subject,
              from: cleanEmail(from),
              date: dateStr,
              status: receiptData.amount > 0 ? "saved" : "no_attachment",
              receiptId: String(receipt._id),
              account: account.email,
            });
          }
        } catch (msgErr) {
          console.error("Error processing message:", msgErr);
        }
      }

      allResults.push(...results);

      // Update lastScanAt for this account
      if (account._id !== "legacy") {
        await GoogleAccount.findByIdAndUpdate(account._id, { lastScanAt: new Date() });
      }
    } catch (err: any) {
      console.error(`Gmail scan error for ${account.email}:`, err.message);
      allResults.push({ subject: `[${account.email}] error`, from: account.email, date: "", status: "error", account: account.email });
    }
  }

  // Save last scan time (backward compat)
  await User.findByIdAndUpdate(userId, { lastGmailScan: new Date() });

  return NextResponse.json({
    success: true,
    scanned: totalMessages,
    processed: allResults.length,
    results: allResults,
  });
}
