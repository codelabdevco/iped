import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-helpers";
import Receipt from "@/models/Receipt";

const SAMPLE_RECEIPTS = [
  // --- ใบเสร็จ (receipt) ---
  { merchant: "7-Eleven สาขาสีลม", amount: 245, category: "อาหาร", categoryIcon: "🍔", type: "receipt", status: "confirmed", paymentMethod: "cash", source: "line", note: "ซื้อข้าว+น้ำ ตอนเที่ยง", documentNumber: "RCP-2026-0001", vat: 16, ocrConfidence: 0.95, date: -1 },
  { merchant: "Grab Food", amount: 389, category: "อาหาร", categoryIcon: "🍔", type: "receipt", status: "pending", paymentMethod: "credit", source: "email", note: "สั่งอาหารเย็น", documentNumber: "RCP-2026-0002", ocrConfidence: 0.82, date: -2 },
  { merchant: "Tops Supermarket", amount: 1250, category: "ของใช้ในบ้าน", categoryIcon: "🏠", type: "receipt", status: "confirmed", paymentMethod: "debit", source: "web", note: "ของใช้ประจำเดือน", documentNumber: "RCP-2026-0003", vat: 82, ocrConfidence: 0.98, date: -3 },
  { merchant: "Shell ปั๊มน้ำมัน", amount: 1500, category: "เดินทาง", categoryIcon: "🚗", type: "receipt", status: "confirmed", paymentMethod: "credit", source: "line", documentNumber: "RCP-2026-0004", vat: 98, date: -4 },
  { merchant: "Watson สยามพารากอน", amount: 890, category: "สุขภาพ", categoryIcon: "💊", type: "receipt", status: "edited", paymentMethod: "transfer", source: "web", note: "วิตามินและยาสามัญ", documentNumber: "RCP-2026-0005", vat: 58, ocrConfidence: 0.91, date: -5 },

  // --- ใบแจ้งหนี้ (invoice) ---
  { merchant: "TRUE Internet", amount: 799, category: "สาธารณูปโภค", categoryIcon: "📡", type: "invoice", status: "paid", paymentMethod: "transfer", source: "email", note: "ค่าเน็ตบ้าน มี.ค. 2569", documentNumber: "INV-TRUE-030269", merchantTaxId: "0107536000269", vat: 52, date: -6 },
  { merchant: "การไฟฟ้านครหลวง", amount: 2350, category: "สาธารณูปโภค", categoryIcon: "⚡", type: "invoice", status: "overdue", paymentMethod: "transfer", source: "email", note: "ค่าไฟเดือน ก.พ. — เกินกำหนดชำระ", documentNumber: "INV-MEA-0269-4521", merchantTaxId: "0994000165941", vat: 154, date: -15 },
  { merchant: "การประปานครหลวง", amount: 485, category: "สาธารณูปโภค", categoryIcon: "💧", type: "invoice", status: "pending", paymentMethod: "cash", source: "web", documentNumber: "INV-MWA-030269", merchantTaxId: "0994000209413", vat: 32, date: -7 },

  // --- บิลเรียกเก็บ (billing) ---
  { merchant: "AIS", amount: 1299, category: "สาธารณูปโภค", categoryIcon: "📱", type: "billing", status: "paid", paymentMethod: "credit", source: "email", note: "แพ็กเกจ 5G + Disney+ Hotstar", documentNumber: "BIL-AIS-0326-8832", merchantTaxId: "0107545000192", vat: 85, date: -8 },
  { merchant: "คอนโด The Line สุขุมวิท", amount: 8500, category: "สาธารณูปโภค", categoryIcon: "🏢", type: "billing", status: "matched", paymentMethod: "transfer", source: "web", note: "ค่าส่วนกลาง มี.ค.", documentNumber: "BIL-CONDO-0326", date: -10 },

  // --- ใบเพิ่มหนี้ (debit_note) ---
  { merchant: "บ.สยามซอฟต์ จำกัด", amount: 3210, category: "การศึกษา", categoryIcon: "📚", type: "debit_note", status: "pending", paymentMethod: "transfer", source: "web", note: "ค่าบริการเพิ่มเติม — อัปเกรดแพ็กเกจ", documentNumber: "DN-SS-2026-042", merchantTaxId: "0105555048203", vat: 210, wht: 96, date: -11 },

  // --- ใบลดหนี้ (credit_note) ---
  { merchant: "Lazada (คืนสินค้า)", amount: -850, category: "ช็อปปิ้ง", categoryIcon: "🛒", type: "credit_note", status: "confirmed", paymentMethod: "transfer", source: "email", note: "คืนสินค้าชำรุด — เคสโทรศัพท์", documentNumber: "CN-LZD-2026-1192", vat: -56, date: -12 },

  // --- สถานะ cancelled ---
  { merchant: "ร้านกาแฟ After You", amount: 320, category: "อาหาร", categoryIcon: "☕", type: "receipt", status: "cancelled", paymentMethod: "cash", source: "line", note: "ยกเลิก — สลิปซ้ำกับรายการอื่น", documentNumber: "RCP-2026-0099", date: -13 },

  // --- ข้อมูลหลากหลาย เพิ่มเติม ---
  { merchant: "Shopee", amount: 2490, category: "ช็อปปิ้ง", categoryIcon: "🛒", type: "receipt", status: "confirmed", paymentMethod: "credit", source: "email", note: "หูฟัง Bluetooth + สายชาร์จ", documentNumber: "RCP-SHP-2026-7821", vat: 163, ocrConfidence: 0.88, date: -14 },
  { merchant: "โรงพยาบาลบำรุงราษฎร์", amount: 4500, category: "สุขภาพ", categoryIcon: "🏥", type: "receipt", status: "confirmed", paymentMethod: "credit", source: "web", note: "ค่าตรวจสุขภาพประจำปี", documentNumber: "RCP-BH-2026-3345", merchantTaxId: "0107536000145", vat: 295, wht: 135, ocrConfidence: 0.97, date: -16 },
  { merchant: "BTS สกายเทรน", amount: 1200, category: "เดินทาง", categoryIcon: "🚆", type: "receipt", status: "confirmed", paymentMethod: "debit", source: "line", note: "เติมเงิน Rabbit Card", documentNumber: "RCP-BTS-2026-001", date: -17 },
  { merchant: "Netflix Thailand", amount: 419, category: "บันเทิง", categoryIcon: "🎬", type: "billing", status: "paid", paymentMethod: "credit", source: "email", note: "Premium Plan มี.ค.", documentNumber: "BIL-NFX-2026-03", vat: 27, date: -18 },
  { merchant: "สำนักงานบัญชี ABC", amount: 15000, category: "การศึกษา", categoryIcon: "📊", type: "invoice", status: "pending", paymentMethod: "transfer", source: "web", note: "ค่าบริการทำบัญชีรายเดือน", documentNumber: "INV-ABC-2026-03", merchantTaxId: "0105562012345", vat: 981, wht: 450, ocrConfidence: 0.72, date: -20 },
  { merchant: "Starbucks สยามสแควร์", amount: 195, category: "อาหาร", categoryIcon: "☕", type: "receipt", status: "confirmed", paymentMethod: "other", source: "line", note: "", date: -1 },
  { merchant: "Central Department Store", amount: 5890, category: "ช็อปปิ้ง", categoryIcon: "🛍️", type: "receipt", status: "pending", paymentMethod: "credit", source: "web", note: "เสื้อผ้า 3 ตัว", documentNumber: "RCP-CEN-2026-4421", vat: 386, ocrConfidence: 0.65, date: -22 },
];

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    await connectDB();

    const now = new Date();
    const docs = SAMPLE_RECEIPTS.map((s) => {
      const d = new Date(now);
      d.setDate(d.getDate() + s.date);
      const { date: _offset, ...rest } = s;
      return {
        ...rest,
        date: d,
        userId: session.userId,
        accountType: "personal",
      };
    });

    const result = await Receipt.insertMany(docs);

    return NextResponse.json({
      success: true,
      message: `สร้างข้อมูลตัวอย่าง ${result.length} รายการ`,
      count: result.length,
    });
  });
}

// DELETE — ลบข้อมูลตัวอย่างทั้งหมด (ลบ receipts ทั้งหมดของ user)
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (session) => {
    await connectDB();
    const result = await Receipt.deleteMany({ userId: session.userId });
    return NextResponse.json({
      success: true,
      message: `ลบข้อมูลทั้งหมด ${result.deletedCount} รายการ`,
      deletedCount: result.deletedCount,
    });
  });
}
