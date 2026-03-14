import { NextRequest, NextResponse } from "next/server";
import { suggestCategory } from "@/lib/categories";

function simulateOCR(filename: string) {
  const merchants = [
    { name: "7-Eleven สาขาสยามพารากอน", amount: 385, category: "food" },
    { name: "Makro สาขารังสิต", amount: 12500, category: "material" },
    { name: "Cafe Amazon สาขาอโศก", amount: 165, category: "food" },
    { name: "Shell สาขาวิภาวดี", amount: 1500, category: "transport" },
    { name: "True Corporation", amount: 1200, category: "service" },
    { name: "การไฟฟ้านครหลวง", amount: 3400, category: "utility" },
    { name: "OfficeMate สาขาฟอร์จูนทาวน์", amount: 2850, category: "office" },
    { name: "โรงพยาบาลบำรุงราษฎร์", amount: 5600, category: "health" },
    { name: "Central Department Store", amount: 8900, category: "other" },
    { name: "Grab Food", amount: 289, category: "food" },
    { name: "Lotus's สาขาบางนา", amount: 4200, category: "material" },
    { name: "PTT Station รามอินทรา", amount: 1800, category: "transport" },
  ];

  const random = merchants[Math.floor(Math.random() * merchants.length)];
  const today = new Date().toISOString().split("T")[0];
  const cat = suggestCategory(random.name);
  const confidence = Math.floor(Math.random() * 15) + 85;
  const vatAmount = Math.round(random.amount * 0.07);

  return {
    merchant: random.name,
    date: today,
    amount: random.amount,
    vat: vatAmount,
    category: cat.id,
    categoryIcon: cat.icon,
    type: "receipt",
    paymentMethod: ["cash", "transfer", "credit"][Math.floor(Math.random() * 3)],
    ocrConfidence: confidence,
    ocrRawText: `${random.name}\nDate: ${today}\nTotal: ${random.amount} THB\nVAT 7%: ${vatAmount} THB`,
  };
}

export async function POST(request: NextRequest) {
  try {
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

    await new Promise((resolve) => setTimeout(resolve, 1500));
    const result = simulateOCR(file.name);

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const imageUrl = `data:${file.type};base64,${base64}`;

    const hashBuffer = new Uint8Array(bytes);
    let hash = 0;
    for (let i = 0; i < Math.min(hashBuffer.length, 1000); i++) {
      hash = (hash * 31 + hashBuffer[i]) & 0x7fffffff;
    }
    const imageHash = hash.toString(16);

    return NextResponse.json({
      success: true,
      data: { ...result, imageUrl, imageHash },
    });
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอ่านใบเสร็จ" }, { status: 500 });
  }
}
