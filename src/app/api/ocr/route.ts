import { NextRequest, NextResponse } from "next/server";
import { processOCR } from "@/lib/ocr";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Auth — must be logged in
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "ไฟล์ไม่รองรับ กรุณาอัปโหลด JPG, PNG หรือ PDF" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป (สูงสุด 10MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Generate stable image hash using SHA-256
    const imageHash = crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex").slice(0, 16);

    // Check for duplicate image BEFORE running OCR
    await connectDB();
    const existingDup = await Receipt.findOne({ imageHash, userId: session.userId }).lean();

    // Run OCR
    const result = await processOCR(base64, file.type);
    const imageUrl = `data:${file.type};base64,${base64}`;

    // Auto-save to receipts
    if (existingDup) {
      // Duplicate found — still save but mark as duplicate
      const dup = await Receipt.create({
        merchant: result.merchant,
        date: result.date || new Date(),
        time: result.time || undefined,
        amount: result.amount || 0,
        vat: result.vat,
        wht: result.wht,
        category: result.category,
        categoryIcon: result.categoryIcon,
        type: result.type || "receipt",
        paymentMethod: result.paymentMethod,
        documentNumber: result.documentNumber,
        merchantTaxId: result.merchantTaxId,
        source: "web",
        status: "duplicate",
        imageUrl,
        imageHash,
        ocrConfidence: (result.ocrConfidence || 0) / 100,
        ocrRawText: result.ocrRawText,
        lineItems: result.lineItems,
        userId: session.userId,
        accountType: session.accountType || "personal",
        note: `พบสลิปซ้ำกับ ${(existingDup as any).merchant} (${new Date((existingDup as any).date).toLocaleDateString("th-TH")})`,
      });

      return NextResponse.json({
        success: true,
        duplicate: true,
        duplicateInfo: `เคยบันทึก ${(existingDup as any).merchant} เมื่อ ${new Date((existingDup as any).date).toLocaleDateString("th-TH")}`,
        data: { ...result, imageUrl, imageHash },
        receipt: { _id: String(dup._id), status: "duplicate" },
      });
    }

    // New receipt — status pending
    const receipt = await Receipt.create({
      merchant: result.merchant,
      date: result.date || new Date(),
      amount: result.amount || 0,
      vat: result.vat,
      wht: result.wht,
      category: result.category,
      categoryIcon: result.categoryIcon,
      type: result.type || "receipt",
      paymentMethod: result.paymentMethod,
      documentNumber: result.documentNumber,
      merchantTaxId: result.merchantTaxId,
      source: "web",
      status: "pending",
      imageUrl,
      imageHash,
      ocrConfidence: (result.ocrConfidence || 0) / 100,
      ocrRawText: result.ocrRawText,
      lineItems: result.lineItems,
      userId: session.userId,
      accountType: session.accountType || "personal",
    });

    // Auto-match
    try {
      const { findMatches } = await import("@/lib/auto-match");
      const matches = await findMatches(String(receipt._id), session.userId);
      console.log("Auto-match:", matches.length, "found for", receipt._id);
    } catch (e) { console.error("Auto-match error:", e); }

    return NextResponse.json({
      success: true,
      data: { ...result, imageUrl, imageHash },
      receipt: { _id: String(receipt._id), status: "pending" },
    });
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอ่านใบเสร็จ" }, { status: 500 });
  }
}
