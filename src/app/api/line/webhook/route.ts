import { NextRequest, NextResponse } from "next/server";
import { verifySignature, replyMessage, getMessageContent, getUserProfile } from "@/lib/line-bot";
import { receiptConfirmFlex, duplicateWarningFlex, errorFlex, notReceiptFlex, dailySummaryFlex, chatResponseFlex } from "@/lib/line-flex";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import User from "@/models/User";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { handleFollow, handleImageOnboarding, handleOnboarding, handleLogout } from "@/lib/onboarding";
import { logger } from "@/lib/logger";

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
    logger.debug("Loading API", { status: res.status });
  } catch (e: any) {
    logger.error("Loading error", { error: e.message });
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

/** Get user's name context for OCR */
async function getUserNameContext(lineUserId: string): Promise<string> {
  try {
    await connectDB();
    const user = await User.findOne({ lineUserId })
      .select("firstNameTh lastNameTh firstNameEn lastNameEn name lineDisplayName")
      .lean() as any;
    if (!user) return "";
    const names: string[] = [];
    if (user.firstNameTh) names.push(`${user.firstNameTh} ${user.lastNameTh || ""}`.trim());
    if (user.firstNameEn) names.push(`${user.firstNameEn} ${user.lastNameEn || ""}`.trim());
    if (user.name && !names.some(n => n.includes(user.name))) names.push(user.name);
    if (names.length === 0) return "";
    return `\n\nIMPORTANT — The user's name is: ${names.join(" / ")}. The user is the person who SENT this slip image, so they are most likely the PAYER/SENDER. For bank transfer slips: if the user's name appears as ผู้โอน/From/ต้นทาง → EXPENSE (they paid). Only mark as INCOME if the user's name explicitly appears as ผู้รับ/To/ปลายทาง AND the slip says เงินเข้า/received. When in doubt, default to EXPENSE. Use the merchant field for the OTHER party's name (the one the user paid to or received from).`;
  } catch { return ""; }
}

/** OCR receipt image with Claude Vision + merchant knowledge context */
async function ocrReceipt(imageBuffer: Buffer, knowledgeCtx: string, userCtx: string = ""): Promise<any> {
  const base64img = imageBuffer.toString("base64");
  const prompt = `Analyze this image. First determine if it is a receipt, invoice, bill, or tax document.

If it is NOT a receipt/invoice/billing/tax document, return ONLY this JSON:
{"isReceipt": false, "confidence": 0, "description": "brief description of what the image actually is in Thai"}

If it IS a receipt/invoice/bill, extract and return ONLY this JSON:
{
  "isReceipt": true,
  "merchant": "store/company name in original language",
  "merchantTaxId": "tax ID if visible or null",
  "date": "YYYY-MM-DD (IMPORTANT: Thai year พ.ศ. = ค.ศ. + 543, so พ.ศ. 2568 = 2025, พ.ศ. 2569 = 2026. Convert to AD/CE year)",
  "time": "HH:MM (24hr format from receipt/slip, or null if not shown)",
  "amount": total_amount_as_number,
  "vat": vat_amount_or_null,
  "category": "MUST use one of these exact names — รายจ่าย: อาหาร, เดินทาง, ช็อปปิ้ง, สาธารณูปโภค, ของใช้ในบ้าน, สุขภาพ, การศึกษา, บันเทิง, ที่พัก, ธุรกิจ, อื่นๆ | รายรับ: เงินเดือน, ฟรีแลนซ์, ขายของ, ลงทุน, โบนัส, คืนเงิน, อื่นๆ | เงินออม: ท่องเที่ยว, กองทุนฉุกเฉิน, บ้าน/รถ, เกษียณ, เงินออม, อื่นๆ",
  "categoryIcon": "emoji matching the category: 🍜อาหาร 🚗เดินทาง 🛒ช็อปปิ้ง 💡สาธารณูปโภค 🏠ของใช้ 🏥สุขภาพ 📚การศึกษา 🎬บันเทิง 🏨ที่พัก 💼ธุรกิจ 💰เงินเดือน 💻ฟรีแลนซ์ 🛍️ขายของ 📈ลงทุน 🎁โบนัส ↩️คืนเงิน ✈️ท่องเที่ยว 🛡️ฉุกเฉิน 🏡บ้าน/รถ 🌴เกษียณ 🐷เงินออม 📦อื่นๆ",
  "items": "brief summary of items in Thai",
  "documentType": "receipt or invoice or tax_invoice or billing",
  "type": "expense, income, or savings. CRITICAL RULE: The person who sends this slip image is almost always the SENDER/PAYER (ผู้โอน/ผู้จ่าย), so DEFAULT to 'expense' for bank transfer slips and PromptPay slips. Only classify as 'income' if the slip EXPLICITLY says 'เงินเข้า', 'ได้รับ', 'received', or shows the user as RECEIVER (ผู้รับ). expense = user PAID/sent money. income = user RECEIVED money (salary, refund, incoming transfer). savings = user moved money to savings (ออมเงิน, กองทุน, ฝากประจำ).",
  "paymentMethod": "detect payment method from slip/receipt. Use these exact values: promptpay (if QR/พร้อมเพย์/PromptPay), bank-scb (SCB/ไทยพาณิชย์), bank-kbank (KBank/กสิกร), bank-bbl (BBL/กรุงเทพ), bank-ktb (KTB/กรุงไทย), bank-bay (BAY/กรุงศรี), bank-tmb (TTB/ทีเอ็มบี), bank-gsb (GSB/ออมสิน), credit (บัตรเครดิต/VISA/MC), debit (บัตรเดบิต), transfer (โอนธนาคารทั่วไป), cash (เงินสด), ewallet-truemoney (TrueMoney), ewallet-rabbit (Rabbit LINE Pay), ewallet-shopee (ShopeePay), other. If it's a bank transfer slip, identify the bank from logo/name.",
  "confidence": 0_to_100_confidence_score
}` + knowledgeCtx + userCtx + "\n\nReturn ONLY valid JSON, no markdown fences.";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64img } },
      { type: "text", text: prompt },
    ]}],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  logger.debug("OCR raw", { preview: text.substring(0, 200) });
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

/** Resolve LINE userId → User's accountType */
async function getUserAccountType(lineUserId: string): Promise<string> {
  try {
    await connectDB();
    const user = await User.findOne({ lineUserId }).select("accountType").lean() as any;
    return user?.accountType || "personal";
  } catch { return "personal"; }
}

/** Save receipt to MongoDB */
async function saveReceipt(ocr: any, lineUserId: string, imgHash: string, imageBuffer?: Buffer): Promise<string> {
  try {
    await connectDB();
    const mongoUserId = await resolveUserId(lineUserId);
    const accountType = await getUserAccountType(lineUserId);
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
      time: ocr.time || undefined,
      amount: ocr.amount,
      vat: ocr.vat || undefined,
      category: ocr.category,
      categoryIcon: ocr.categoryIcon || "\ud83d\udcdd",
      paymentMethod: ocr.paymentMethod || undefined,
      direction: ocr.type === "income" ? "income" : ocr.type === "savings" ? "savings" : "expense",
      status: "pending",
      imageUrl,
      imageHash: imgHash,
      ocrConfidence: (ocr.confidence || 0) / 100,
      ocrRawText: ocr.items || "",
      userId: mongoUserId,
      accountType,
    });
    logger.info("Saved receipt", { receiptId: String(r._id), userId: mongoUserId, accountType });
    return r._id.toString();
  } catch (e: any) {
    logger.error("Save error", { error: e.message });
    return "";
  }
}

/** Get today's summary for a user */
async function getDailySummary(userId: string) {
  await connectDB();
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000); // Bangkok time
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  todayStart.setTime(todayStart.getTime() - 7 * 60 * 60 * 1000); // back to UTC

  const receipts = await Receipt.find({
    userId,
    date: { $gte: todayStart },
    status: { $ne: "cancelled" },
  }).lean();

  const totalExpense = receipts.filter((r: any) => r.direction !== "income" && r.direction !== "savings").reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalIncome = receipts.filter((r: any) => r.direction === "income").reduce((s: number, r: any) => s + (r.amount || 0), 0);

  // Top categories
  const catMap: Record<string, { icon: string; amount: number }> = {};
  for (const r of receipts as any[]) {
    if (r.direction === "income" || r.direction === "savings") continue;
    const key = r.category || "อื่นๆ";
    if (!catMap[key]) catMap[key] = { icon: r.categoryIcon || "📦", amount: 0 };
    catMap[key].amount += r.amount || 0;
  }
  const categories = Object.entries(catMap)
    .map(([name, v]) => ({ icon: v.icon, name, amount: v.amount }))
    .sort((a, b) => b.amount - a.amount);

  return { totalExpense, totalIncome, count: receipts.length, categories, date: new Date().toISOString() };
}

/** AI chat — answer financial questions using user's receipt data */
async function aiChat(question: string, userId: string): Promise<{ answer: string; details?: { label: string; value: string }[] }> {
  await connectDB();
  // Get recent receipts for context
  const receipts = await Receipt.find({ userId, status: { $ne: "cancelled" } })
    .select("merchant amount category direction date paymentMethod")
    .sort({ date: -1 }).limit(50).lean();

  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonth = receipts.filter((r: any) => new Date(r.date) >= monthStart);
  const monthExpense = thisMonth.filter((r: any) => r.direction !== "income" && r.direction !== "savings").reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const monthIncome = thisMonth.filter((r: any) => r.direction === "income").reduce((s: number, r: any) => s + (r.amount || 0), 0);

  const ctx = `User's financial data:
- This month expense: ฿${monthExpense.toLocaleString()}
- This month income: ฿${monthIncome.toLocaleString()}
- Total receipts: ${receipts.length}
- Recent transactions (last 20):
${(receipts as any[]).slice(0, 20).map((r: any) => `  ${r.direction || "expense"} | ${r.merchant} | ฿${r.amount} | ${r.category} | ${new Date(r.date).toLocaleDateString("th-TH")}`).join("\n")}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: `${ctx}\n\nUser asks: "${question}"\n\nAnswer in Thai, concise (1-3 sentences). If relevant, include a details array with label/value pairs for key numbers. Return JSON:\n{"answer": "...", "details": [{"label": "...", "value": "..."}]}` }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { answer: text.slice(0, 300) };
  }
}

/** Quick reply buttons after receipt save */
function quickReplyButtons(): any {
  return {
    items: [
      { type: "action", action: { type: "message", label: "📊 สรุปวันนี้", text: "สรุปวันนี้" } },
      { type: "action", action: { type: "uri", label: "📋 ดูใบเสร็จ", uri: `${APP_URL}/dashboard/receipts` } },
      { type: "action", action: { type: "uri", label: "📈 รายงาน", uri: `${APP_URL}/dashboard/reports` } },
    ],
  };
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
  logger.debug("Webhook hit");
  try {
    const body = await request.text();
    const sig = request.headers.get("x-line-signature") || "";
    // Verify signature using process.env directly (not cached module-level constant)
    const secret = process.env.LINE_CHANNEL_SECRET || "";
    if (secret && sig) {
      const hash = crypto.createHmac("SHA256", secret).update(body).digest("base64");
      if (hash !== sig) {
        logger.warn("Sig mismatch", { secretLen: secret.length });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
    const data = JSON.parse(body);
    const events = data.events || [];
    logger.debug("Events received", { count: events.length });

    for (const ev of events) {
      const uid = ev.source?.userId;
      logger.debug("Event type", { type: ev.type, messageType: ev.message?.type });

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
        logger.debug("Reply: onboarding step");
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
        logger.debug("User needs onboarding, skipping image processing");
        continue;
      }
        const rt = ev.replyToken;
        const qt = ev.message?.quoteToken || "";

        if (uid) { await showLoading(uid, 60); }

        try {
          // 1. Get merchant knowledge + user name context
          const [knowledge, userNameCtx] = await Promise.all([
            getMerchantKnowledge(),
            getUserNameContext(uid || ""),
          ]);
          logger.debug("Context loaded", { merchants: knowledge ? "yes" : "none", userCtx: userNameCtx ? "yes" : "none" });

          // 2. Download image & OCR
          const imageBuffer = await getMessageContent(ev.message.id);
          const imgHash = crypto.createHash("md5").update(imageBuffer).digest("hex");
          logger.debug("Image received", { size: imageBuffer.length, hash: imgHash });
          const ocr = await ocrReceipt(imageBuffer, knowledge, userNameCtx);
          logger.debug("OCR result", { merchant: ocr?.merchant, amount: ocr?.amount, isReceipt: ocr?.isReceipt });

          // 3. Not a receipt? → save as draft + ask to confirm
          if (!ocr || ocr.isReceipt === false) {
            const mongoUidNr = await resolveUserId(uid || "");
            const nrAccountType = await getUserAccountType(uid || "");
            let nrImageUrl: string | undefined;
            if (imageBuffer) nrImageUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
            const nrReceipt = await Receipt.create({
              type: "receipt", source: "line",
              merchant: ocr?.merchant || "ไม่ระบุ",
              date: ocr?.date ? new Date(ocr.date) : new Date(),
              time: ocr?.time || undefined,
              amount: ocr?.amount || 0,
              category: ocr?.category || "อื่นๆ",
              categoryIcon: ocr?.categoryIcon || "📦",
              paymentMethod: ocr?.paymentMethod || undefined,
              direction: "expense",
              status: "draft",
              imageUrl: nrImageUrl, imageHash: imgHash,
              ocrConfidence: (ocr?.confidence || 0) / 100,
              userId: mongoUidNr, accountType: nrAccountType,
              note: "ระบบตรวจพบว่าอาจไม่ใช่ใบเสร็จ — รอยืนยัน",
            });
            const nrFlex = notReceiptFlex(String(nrReceipt._id));
            await replyMessage(rt, [{ type: "text", text: "📄 ภาพนี้อาจไม่ใช่ใบเสร็จ", quoteToken: qt }, nrFlex]);
            logger.debug("Reply: not_receipt", { draftId: String(nrReceipt._id) });
            continue;
          }

          // 4. Cannot read? (❌)
    if (!ocr.amount) {
      const errFlex = errorFlex(ocr.confidence);
      await replyMessage(rt, [{ type: "text", text: "❌ ไม่สามารถอ่านใบเสร็จได้", quoteToken: qt }, errFlex]);
      logger.debug("Reply: error no amount");
      continue;
    }

          // 5. Check duplicate (🔄)
          const mongoUid = await resolveUserId(uid || "");
          const dup = await checkDuplicate(ocr.merchant, ocr.amount, ocr.date, mongoUid);
          const status = getStatus(ocr, dup);
          logger.debug("Receipt status", { type: status.type, emoji: status.emoji });
          
          if (status.type === "duplicate") {
            // Save as draft — not shown in normal receipts until confirmed
            const mongoUidDup = await resolveUserId(uid || "");
            const dupAccountType = await getUserAccountType(uid || "");
            let dupImageUrl: string | undefined;
            if (imageBuffer) dupImageUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
            const dupReceipt = await Receipt.create({
              type: ocr.documentType === "tax_invoice" ? "invoice" : "receipt",
              source: "line",
              merchant: ocr.merchant,
              merchantTaxId: ocr.merchantTaxId || undefined,
              date: new Date(ocr.date),
              time: ocr.time || undefined,
              amount: ocr.amount,
              vat: ocr.vat || undefined,
              category: ocr.category,
              categoryIcon: ocr.categoryIcon || "\ud83d\udcdd",
              paymentMethod: ocr.paymentMethod || undefined,
              direction: ocr.type === "income" ? "income" : ocr.type === "savings" ? "savings" : "expense",
              status: "draft",
              imageUrl: dupImageUrl,
              imageHash: imgHash,
              ocrConfidence: (ocr.confidence || 0) / 100,
              ocrRawText: ocr.items || "",
              userId: mongoUidDup,
              accountType: dupAccountType,
              note: `พบสลิปซ้ำกับ ${dup.merchant} (${dup.date ? new Date(dup.date).toLocaleDateString("th-TH") : ""})`,
            });
            logger.debug("Saved draft (duplicate)", { draftId: String(dupReceipt._id) });

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
            logger.debug("Reply: duplicate (draft)");
            continue;
          }

          // 6. Save receipt to DB (with image)
          const savedId = await saveReceipt(ocr, uid || "", imgHash, imageBuffer);
          const rid = savedId || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

          // 7. Build flex message
          const flexMsg = receiptConfirmFlex({
            merchant: ocr.merchant || "\u0e44\u0e21\u0e48\u0e23\u0e30\u0e1a\u0e38\u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32",
            date: ocr.date || new Date().toLocaleDateString("th-TH"),
            time: ocr.time || undefined,
            amount: ocr.amount,
            vat: ocr.vat || undefined,
            category: ocr.category || "\u0e2d\u0e37\u0e48\u0e19\u0e46",
            categoryIcon: ocr.categoryIcon || "\ud83d\udcdd",
            confidence: ocr.confidence || 50,
            receiptId: rid,
            webAppUrl: APP_URL,
            direction: ocr.type === "income" ? "income" : ocr.type === "savings" ? "savings" : "expense",
          });

          // 8. Reply: status text (quoted on image) + flex summary + quick reply
          const statusText = status.emoji + " " + status.title + (status.sub ? "\n" + status.sub : "");
          await replyMessage(rt, [
            { type: "text", text: statusText, quoteToken: qt },
            { ...flexMsg, quickReply: quickReplyButtons() },
          ]);
        logger.info("Reply sent", { type: status.type });

        } catch (err: any) {
          logger.error("Process error", { error: err.message || String(err) });
          try {
            await replyMessage(rt, [{ type: "text", text: "\u274c \u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07", quoteToken: qt }]);
          } catch {}
        }

      // === TEXT MESSAGE ===
    } else if (ev.type === "message" && ev.message?.type === "text") {
      // Onboarding already checked above — handle commands & AI chat
      const msgText = (ev.message.text || "").trim();
      const msgLower = msgText.toLowerCase();

      // Daily summary command
      if (msgLower.includes("สรุป") || msgLower.includes("summary") || msgLower.includes("วันนี้")) {
        try {
          if (uid) await showLoading(uid, 10);
          const mongoId = await resolveUserId(uid || "");
          const summary = await getDailySummary(mongoId);
          const flex = dailySummaryFlex(summary);
          await replyMessage(ev.replyToken, [flex]);
          logger.debug("Reply: daily summary");
        } catch (e: any) {
          logger.error("Summary error", { error: e.message });
          await replyMessage(ev.replyToken, [{ type: "text", text: "❌ ไม่สามารถดึงข้อมูลสรุปได้" }]);
        }

      // Join company command
      } else if (msgLower.startsWith("เชื่อม") || msgLower.startsWith("join ") || msgLower.startsWith("เข้าร่วม")) {
        try {
          const code = msgText.replace(/^(เชื่อมบริษัท|เชื่อม|join|เข้าร่วม)\s*/i, "").trim();
          if (!code) {
            await replyMessage(ev.replyToken, [{ type: "text", text: "📝 พิมพ์ \"เชื่อม [รหัสเชิญ]\" เพื่อเชื่อมต่อบริษัท\nเช่น: เชื่อม a1b2c3d4e5f6" }]);
          } else {
            const mongoId = await resolveUserId(uid || "");
            const Organization = (await import("@/models/Organization")).default;
            const org = await Organization.findOne({ inviteCode: code, status: "active" });
            if (!org) {
              await replyMessage(ev.replyToken, [{ type: "text", text: "❌ รหัสเชิญไม่ถูกต้องหรือหมดอายุ" }]);
            } else {
              const isMember = org.members?.some((m: any) => String(m.userId) === mongoId);
              if (isMember) {
                await replyMessage(ev.replyToken, [{ type: "text", text: `✅ คุณเป็นสมาชิก ${org.name} อยู่แล้ว\n\nส่งสลิปมาได้เลย จะบันทึกเข้าบัญชีส่วนตัว\nแล้วกด "ส่งเข้าบริษัท" ในหน้าใบเสร็จ` }]);
              } else {
                org.members = org.members || [];
                org.members.push({ userId: mongoId, role: "viewer", joinedAt: new Date() });
                await org.save();
                const User = (await import("@/models/User")).default;
                await User.findByIdAndUpdate(mongoId, { orgId: org._id });
                await replyMessage(ev.replyToken, [
                  { type: "text", text: `🏢 เข้าร่วม "${org.name}" เรียบร้อยแล้ว!\n\nตอนนี้คุณสามารถส่งใบเสร็จเข้าบริษัทได้\nเปิดหน้าใบเสร็จ → แก้ไข → กด "ส่งเข้าบริษัท"` },
                ]);
              }
            }
          }
          logger.debug("Reply: join org");
        } catch (e: any) {
          logger.error("Join org error", { error: e.message });
          await replyMessage(ev.replyToken, [{ type: "text", text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่" }]);
        }

      // AI chat — any other text
      } else {
        try {
          if (uid) await showLoading(uid, 30);
          const mongoId = await resolveUserId(uid || "");
          const result = await aiChat(msgText, mongoId);
          const flex = chatResponseFlex({ question: msgText, answer: result.answer, details: result.details });
          await replyMessage(ev.replyToken, [flex]);
          logger.debug("Reply: AI chat");
        } catch (e: any) {
          logger.error("AI chat error", { error: e.message });
          await replyMessage(ev.replyToken, [{ type: "text", text: "ส่งรูปสลิปหรือใบเสร็จมาได้เลยครับ 📸\nหรือพิมพ์ถามเรื่องการเงินได้เลย" }]);
        }
      }

    // === FOLLOW ===
  } else if (ev.type === "follow") {
    await handleFollow(ev.replyToken, uid);

  // === POSTBACK (action buttons) ===
      } else if (ev.type === "postback") {
        const pd = ev.postback?.data || "";
        const params = new URLSearchParams(pd);
        const action = params.get("action");
        const id = params.get("id");
        logger.debug("Postback received", { action, id });

        try {
          await connectDB();
          if (action === "confirm" && id) {
            await Receipt.findByIdAndUpdate(id, { status: "confirmed" });
            await replyMessage(ev.replyToken, [
              { type: "text", text: "✅ ยืนยันใบเสร็จเรียบร้อยแล้ว", quickReply: quickReplyButtons() },
            ]);
          } else if (action === "force_save" && id) {
            // Duplicate confirmed — change from draft to duplicate (visible in system)
            await Receipt.findByIdAndUpdate(id, { status: "duplicate", note: "ยืนยันบันทึกซ้ำ" });
            await replyMessage(ev.replyToken, [
              { type: "text", text: "✅ ยืนยันบันทึกสลิปซ้ำเรียบร้อยแล้ว", quickReply: quickReplyButtons() },
            ]);
          } else if (action === "confirm_not_receipt" && id) {
            // Not-receipt confirmed — change from draft to pending (visible in system)
            await Receipt.findByIdAndUpdate(id, { status: "pending", note: "ยืนยันบันทึก (อาจไม่ใช่ใบเสร็จ)" });
            await replyMessage(ev.replyToken, [
              { type: "text", text: "✅ ยืนยันบันทึกเรียบร้อยแล้ว\nแก้ไขข้อมูลได้ที่หน้าใบเสร็จ", quickReply: quickReplyButtons() },
            ]);
          } else if (action === "join_org") {
            const code = params.get("code");
            if (code) {
              const Organization = (await import("@/models/Organization")).default;
              const org = await Organization.findOne({ inviteCode: code, status: "active" });
              if (org) {
                const mongoId = await resolveUserId(uid || "");
                const isMember = org.members?.some((m: any) => String(m.userId) === mongoId);
                if (!isMember) {
                  org.members = org.members || [];
                  org.members.push({ userId: mongoId, role: "viewer", joinedAt: new Date() });
                  await org.save();
                  const UserModel = (await import("@/models/User")).default;
                  await UserModel.findByIdAndUpdate(mongoId, { orgId: org._id });
                }
                await replyMessage(ev.replyToken, [{ type: "text", text: `🏢 เชื่อมต่อ "${org.name}" เรียบร้อย!\nส่งสลิปมาแล้วกด "ส่งเข้าบริษัท" ได้เลย`, quickReply: quickReplyButtons() }]);
              } else {
                await replyMessage(ev.replyToken, [{ type: "text", text: "❌ รหัสเชิญไม่ถูกต้อง" }]);
              }
            }
          } else if (action === "cancel" && id) {
            // Cancel — delete draft entirely
            await Receipt.findByIdAndDelete(id);
            await replyMessage(ev.replyToken, [{ type: "text", text: "❌ ยกเลิกแล้ว — ไม่บันทึกรายการนี้" }]);
          } else {
            await replyMessage(ev.replyToken, [{ type: "text", text: "ไม่พบคำสั่ง" }]);
          }
        } catch (e: any) {
          logger.error("Postback error", { error: e.message });
          await replyMessage(ev.replyToken, [{ type: "text", text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่" }]);
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("Webhook error", { error: err.message || String(err) });
    return NextResponse.json({ success: true });
  }
}
