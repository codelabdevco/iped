import { NextRequest, NextResponse } from "next/server";
import { verifySignature, replyMessage, getMessageContent, getUserProfile } from "@/lib/line-bot";
import { receiptConfirmFlex, duplicateWarningFlex, errorFlex, notReceiptFlex } from "@/lib/line-flex";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import User from "@/models/User";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { handleFollow, handleImageOnboarding, handleOnboarding, handleLogout } from "@/lib/onboarding";

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function showLoading(chatId: string, sec: number = 60) {
  try {
    const res = await fetch("https://api.line.me/v2/bot/chat/loading/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + TOKEN },
      body: JSON.stringify({ chatId, loadingSeconds: sec }),
    });
    console.log("Loading API:", res.status);
  } catch (e: any) {
    console.error("Loading error:", e.message);
  }
}

/** Fetch known merchants from DB to give AI context */
async function getMerchantKnowledge(): Promise<string> {
  try {
    await connectDB();
    const merchants = await Receipt.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: {
        _id: "$merchant",
        category: { $first: "$category" },
        categoryIcon: { $first: "$categoryIcon" },
        count: { $sum: 1 },
        avgAmount: { $avg: "$amount" }
      }},
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);
    if (merchants.length === 0) return "";
    const list = merchants.map((m: any) =>
      `- "${m._id}": category="${m.category}" icon=${m.categoryIcon} (seen ${m.count}x, avg ${Math.round(m.avgAmount)} THB)`
    ).join("\n");
    return "\n\nKnown merchants from our database (use same category if you see them again):\n" + list;
  } catch {
    return "";
  }
}

/** OCR receipt image with Claude Vision + merchant knowledge context */
async function ocrReceipt(imageBuffer: Buffer, knowledgeCtx: string): Promise<any> {
  const base64img = imageBuffer.toString("base64");
  const prompt = `Analyze this image. First determine if it is a receipt, invoice, bill, or tax document.

If it is NOT a receipt/invoice/billing/tax document, return ONLY this JSON:
{"isReceipt": false, "confidence": 0, "description": "brief description of what the image actually is in Thai"}

If it IS a receipt/invoice/bill, extract and return ONLY this JSON:
{
  "isReceipt": true,
  "merchant": "store/company name in original language",
  "merchantTaxId": "tax ID if visible or null",
  "date": "YYYY-MM-DD",
  "amount": total_amount_as_number,
  "vat": vat_amount_or_null,
  "category": "category name in Thai (e.g. \u0e2d\u0e32\u0e2b\u0e32\u0e23, \u0e04\u0e21\u0e19\u0e32\u0e04\u0e21, \u0e2a\u0e32\u0e18\u0e32\u0e23\u0e13\u0e39\u0e1b\u0e42\u0e20\u0e04, \u0e40\u0e14\u0e34\u0e19\u0e17\u0e32\u0e07, \u0e17\u0e35\u0e48\u0e1e\u0e31\u0e01, \u0e0a\u0e47\u0e2d\u0e1b\u0e1b\u0e34\u0e49\u0e07, \u0e2a\u0e38\u0e02\u0e20\u0e32\u0e1e, \u0e1a\u0e31\u0e19\u0e40\u0e17\u0e34\u0e07, \u0e01\u0e32\u0e23\u0e28\u0e36\u0e01\u0e29\u0e32, \u0e2d\u0e37\u0e48\u0e19\u0e46)",
  "categoryIcon": "single emoji for the category",
  "items": "brief summary of items in Thai",
  "documentType": "receipt or invoice or tax_invoice or billing",
  "paymentMethod": "detect payment method from slip/receipt. Use these exact values: promptpay (if QR/พร้อมเพย์/PromptPay), bank-scb (SCB/ไทยพาณิชย์), bank-kbank (KBank/กสิกร), bank-bbl (BBL/กรุงเทพ), bank-ktb (KTB/กรุงไทย), bank-bay (BAY/กรุงศรี), bank-tmb (TTB/ทีเอ็มบี), bank-gsb (GSB/ออมสิน), credit (บัตรเครดิต/VISA/MC), debit (บัตรเดบิต), transfer (โอนธนาคารทั่วไป), cash (เงินสด), ewallet-truemoney (TrueMoney), ewallet-rabbit (Rabbit LINE Pay), ewallet-shopee (ShopeePay), other. If it's a bank transfer slip, identify the bank from logo/name.",
  "confidence": 0_to_100_confidence_score
}` + knowledgeCtx + "\n\nReturn ONLY valid JSON, no markdown fences.";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64img } },
      { type: "text", text: prompt },
    ]}],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  console.log("OCR raw:", text.substring(0, 200));
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

/** Check for duplicate receipt in DB */
async function checkDuplicate(merchant: string, amount: number, date: string, userId: string): Promise<any> {
  try {
    await connectDB();
    const dateObj = new Date(date);
    const dayStart = new Date(dateObj); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateObj); dayEnd.setHours(23, 59, 59, 999);
    const searchName = merchant.length > 8 ? merchant.substring(0, 8) : merchant;
    return await Receipt.findOne({
      merchant: { $regex: new RegExp(searchName.replace(/[.*+?^${}()|[\\\]|\]]/g, "\\$&"), "i") },
      amount: amount,
      date: { $gte: dayStart, $lte: dayEnd },
      userId: userId,
      status: { $ne: "cancelled" }
    });
  } catch { return null; }
}

/** Resolve LINE userId → MongoDB _id */
async function resolveUserId(lineUserId: string): Promise<string> {
  try {
    await connectDB();
    const user = await User.findOne({ lineUserId }).select("_id").lean();
    return user ? String(user._id) : lineUserId;
  } catch {
    return lineUserId;
  }
}

/** Save receipt to MongoDB */
async function saveReceipt(ocr: any, lineUserId: string, imgHash: string, imageBuffer?: Buffer): Promise<string> {
  try {
    await connectDB();
    const mongoUserId = await resolveUserId(lineUserId);
    // Store image as base64 data URL
    let imageUrl: string | undefined;
    if (imageBuffer) {
      imageUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    }
    const r = await Receipt.create({
      type: ocr.documentType === "tax_invoice" ? "invoice" : "receipt",
      source: "line",
      merchant: ocr.merchant,
      merchantTaxId: ocr.merchantTaxId || undefined,
      date: new Date(ocr.date),
      amount: ocr.amount,
      vat: ocr.vat || undefined,
      category: ocr.category,
      categoryIcon: ocr.categoryIcon || "\ud83d\udcdd",
      paymentMethod: ocr.paymentMethod || undefined,
      status: "pending",
      imageUrl,
      imageHash: imgHash,
      ocrConfidence: (ocr.confidence || 0) / 100,
      ocrRawText: ocr.items || "",
      userId: mongoUserId,
    });
    console.log("Saved receipt:", r._id, "userId:", mongoUserId);
    return r._id.toString();
  } catch (e: any) {
    console.error("Save error:", e.message);
    return "";
  }
}

type StatusResult = { type: string; emoji: string; title: string; sub: string };

function getStatus(ocr: any, isDuplicate: any): StatusResult {
  // \u274c = red X, \ud83d\udcc4 = page, \ud83d\udd04 = arrows, \u2705 = check, \u26a0\ufe0f = warning
  if (!ocr) return { type: "error", emoji: "\u274c", title: "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2d\u0e48\u0e32\u0e19\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e44\u0e14\u0e49", sub: "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e16\u0e48\u0e32\u0e22\u0e23\u0e39\u0e1b\u0e43\u0e2b\u0e49\u0e0a\u0e31\u0e14\u0e40\u0e08\u0e19\u0e41\u0e25\u0e49\u0e27\u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48" };
  if (ocr.isReceipt === false) return { type: "not_receipt", emoji: "\ud83d\udcc4", title: "\u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08/\u0e43\u0e1a\u0e01\u0e33\u0e01\u0e31\u0e1a\u0e20\u0e32\u0e29\u0e35", sub: ocr.description || "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e2a\u0e48\u0e07\u0e23\u0e39\u0e1b\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e2b\u0e23\u0e37\u0e2d\u0e43\u0e1a\u0e01\u0e33\u0e01\u0e31\u0e1a\u0e20\u0e32\u0e29\u0e35" };
  if (isDuplicate) return { type: "duplicate", emoji: "\ud83d\udd04", title: "\u0e15\u0e23\u0e27\u0e08\u0e1e\u0e1a\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e0b\u0e49\u0e33", sub: "\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e19\u0e35\u0e49\u0e2d\u0e32\u0e08\u0e16\u0e39\u0e01\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e41\u0e25\u0e49\u0e27" };
  if (ocr.confidence >= 70) return { type: "success", emoji: "\u2705", title: "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e04\u0e48\u0e32\u0e43\u0e0a\u0e49\u0e08\u0e48\u0e32\u0e22\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08", sub: "" };
  if (ocr.confidence >= 40) return { type: "warning", emoji: "\u26a0\ufe0f", title: "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \u0e41\u0e15\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e1a\u0e32\u0e07\u0e2a\u0e48\u0e27\u0e19\u0e44\u0e21\u0e48\u0e0a\u0e31\u0e14\u0e40\u0e08\u0e19", sub: "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e04\u0e27\u0e32\u0e21\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07" };
  return { type: "low_conf", emoji: "\u274c", title: "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2d\u0e48\u0e32\u0e19\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e44\u0e14\u0e49", sub: "\u0e20\u0e32\u0e1e\u0e44\u0e21\u0e48\u0e0a\u0e31\u0e14\u0e40\u0e08\u0e19 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e16\u0e48\u0e32\u0e22\u0e43\u0e2b\u0e21\u0e48" };
}

export async function POST(request: NextRequest) {
  console.log("=== Webhook hit ===");
  try {
    const body = await request.text();
    const sig = request.headers.get("x-line-signature") || "";
    if (!verifySignature(body, sig)) {
      console.log("Bad sig");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const data = JSON.parse(body);
    const events = data.events || [];
    console.log("Events:", events.length);

    for (const ev of events) {
      const uid = ev.source?.userId;
      console.log("Type:", ev.type, ev.message?.type);

      // === ONBOARDING CHECK ===
    if (uid && ev.type === "message" && ev.message?.type === "text") {
      let dn = "";
      try { const p = await getUserProfile(uid); dn = p.displayName || ""; } catch {}
      // Check logout command
        const txtLower = (ev.message as any).text?.trim().toLowerCase() || "";
        if (txtLower === "logout" || txtLower === "\u0e2d\u0e2d\u0e01\u0e08\u0e32\u0e01\u0e23\u0e30\u0e1a\u0e1a") {
          await handleLogout(ev.replyToken, uid);
          continue;
        }
        const handled = await handleOnboarding(ev.replyToken, uid, ev.message.text, dn);
      if (handled) {
        console.log("Reply: onboarding step");
        continue;
      }
    }
//     if (uid && ev.type === "message" && ev.message?.type === "image") {
//       // Check if user needs onboarding first
//       const handled = await handleOnboarding(ev.replyToken, uid, "");
//       if (handled) {
//         console.log("Reply: onboarding (image trigger)");
//         continue;
//       }
//     }

    // === IMAGE MESSAGE ===
      if (ev.type === "message" && ev.message?.type === "image") {
      // Check if user needs onboarding first
      const needsOnboard = await handleImageOnboarding(ev.replyToken, uid);
      if (needsOnboard) {
        console.log("User needs onboarding, skipping image processing");
        continue;
      }
        const rt = ev.replyToken;
        const qt = ev.message?.quoteToken || "";

        if (uid) { await showLoading(uid, 60); }

        try {
          // 1. Get merchant knowledge from DB
          const knowledge = await getMerchantKnowledge();
          console.log("Knowledge merchants:", knowledge ? "yes" : "none");

          // 2. Download image & OCR
          const imageBuffer = await getMessageContent(ev.message.id);
          const imgHash = crypto.createHash("md5").update(imageBuffer).digest("hex");
          console.log("Image size:", imageBuffer.length, "hash:", imgHash);
          const ocr = await ocrReceipt(imageBuffer, knowledge);
          console.log("OCR:", JSON.stringify(ocr));

          // 3. Not a receipt? (📄)
          if (!ocr || ocr.isReceipt === false) {
            const nrFlex = notReceiptFlex();
            await replyMessage(rt, [{ type: "text", text: "📄 ภาพนี้ไม่ใช่ใบเสร็จ", quoteToken: qt }, nrFlex]);
            console.log("Reply: not_receipt");
            continue;
          }

          // 4. Cannot read? (❌)
    if (!ocr.amount) {
      const errFlex = errorFlex(ocr.confidence);
      await replyMessage(rt, [{ type: "text", text: "❌ ไม่สามารถอ่านใบเสร็จได้", quoteToken: qt }, errFlex]);
      console.log("Reply: error no amount");
      continue;
    }

          // 5. Check duplicate (🔄)
          const mongoUid = await resolveUserId(uid || "");
          const dup = await checkDuplicate(ocr.merchant, ocr.amount, ocr.date, mongoUid);
          const status = getStatus(ocr, dup);
          console.log("Status", status.type, status.emoji);
          
          if (status.type === "duplicate") {
            // Still save with "duplicate" status so it shows in dashboard
            const mongoUidDup = await resolveUserId(uid || "");
            let dupImageUrl: string | undefined;
            if (imageBuffer) dupImageUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
            const dupReceipt = await Receipt.create({
              type: ocr.documentType === "tax_invoice" ? "invoice" : "receipt",
              source: "line",
              merchant: ocr.merchant,
              merchantTaxId: ocr.merchantTaxId || undefined,
              date: new Date(ocr.date),
              amount: ocr.amount,
              vat: ocr.vat || undefined,
              category: ocr.category,
              categoryIcon: ocr.categoryIcon || "\ud83d\udcdd",
              paymentMethod: ocr.paymentMethod || undefined,
              status: "duplicate",
              imageUrl: dupImageUrl,
              imageHash: imgHash,
              ocrConfidence: (ocr.confidence || 0) / 100,
              ocrRawText: ocr.items || "",
              userId: mongoUidDup,
              note: `พบสลิปซ้ำกับ ${dup.merchant} (${dup.date ? new Date(dup.date).toLocaleDateString("th-TH") : ""})`,
            });
            console.log("Saved duplicate:", dupReceipt._id);

            const dupFlex = duplicateWarningFlex({
              merchant: ocr.merchant,
              amount: ocr.amount,
              originalDate: dup.date ? new Date(dup.date).toLocaleDateString("th-TH") : ocr.date,
              receiptId: String(dupReceipt._id),
            });
            await replyMessage(rt, [
              { type: "text", text: status.emoji + " " + status.title + "\n" + status.sub, quoteToken: qt },
              dupFlex
            ]);
            console.log("Reply: duplicate");
            continue;
          }

          // 6. Save receipt to DB (with image)
          const savedId = await saveReceipt(ocr, uid || "", imgHash, imageBuffer);
          const rid = savedId || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

          // 7. Build flex message
          const flexMsg = receiptConfirmFlex({
            merchant: ocr.merchant || "\u0e44\u0e21\u0e48\u0e23\u0e30\u0e1a\u0e38\u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32",
            date: ocr.date || new Date().toLocaleDateString("th-TH"),
            amount: ocr.amount,
            vat: ocr.vat || undefined,
            category: ocr.category || "\u0e2d\u0e37\u0e48\u0e19\u0e46",
            categoryIcon: ocr.categoryIcon || "\ud83d\udcdd",
            confidence: ocr.confidence || 50,
            receiptId: rid,
            webAppUrl: APP_URL,
      isExpense: ocr.type !== "income",
          });

          // 8. Reply: status text (quoted on image) + flex summary
          const statusText = status.emoji + " " + status.title + (status.sub ? "\n" + status.sub : "");
          await replyMessage(rt, [
            { type: "text", text: statusText, quoteToken: qt },flexMsg
        ]);
        console.log("Reply:", status.type);

        } catch (err: any) {
          console.error("Process error:", err.message || err);
          try {
            await replyMessage(rt, [{ type: "text", text: "\u274c \u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07", quoteToken: qt }]);
          } catch {}
        }

      // === TEXT MESSAGE ===
    } else if (ev.type === "message" && ev.message?.type === "text") {
      // Check onboarding first
      let dn = "";
      try { const p = await getUserProfile(uid); dn = p.displayName || ""; } catch {}
      const handled = await handleOnboarding(ev.replyToken, uid, ev.message.text, dn);
      if (!handled) {
        await replyMessage(ev.replyToken, [{ type: "text", text: "\u0e2a\u0e48\u0e07\u0e23\u0e39\u0e1b\u0e2a\u0e25\u0e34\u0e1b\u0e2b\u0e23\u0e37\u0e2d\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e21\u0e32\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22\u0e04\u0e23\u0e31\u0e1b \ud83d\udcf8" }]);
      }

    // === FOLLOW ===
  } else if (ev.type === "follow") {
    await handleFollow(ev.replyToken, uid);

  // === POSTBACK (duplicate buttons) ===
      } else if (ev.type === "postback") {
        const pd = ev.postback?.data || "";
        console.log("Postback:", pd);
        if (pd.includes("action=force_save")) {
          await replyMessage(ev.replyToken, [{ type: "text", text: "\u2705 \u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e0b\u0e49\u0e33\u0e40\u0e23\u0e35\u0e22\u0e1a\u0e23\u0e49\u0e2d\u0e22\u0e41\u0e25\u0e49\u0e27" }]);
        } else if (pd.includes("action=cancel")) {
          await replyMessage(ev.replyToken, [{ type: "text", text: "\u274c \u0e22\u0e01\u0e40\u0e25\u0e34\u0e01\u0e01\u0e32\u0e23\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e40\u0e23\u0e35\u0e22\u0e1a\u0e23\u0e49\u0e2d\u0e22\u0e41\u0e25\u0e49\u0e27" }]);
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook err:", err.message || err);
    return NextResponse.json({ success: true });
  }
}
