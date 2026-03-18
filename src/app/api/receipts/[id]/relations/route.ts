import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import Match from "@/models/Match";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session) => {
    await connectDB();
    const { id } = await params;

    const receipt = await Receipt.findOne({ _id: id, userId: session.userId })
      .select("merchant amount date category status direction source")
      .lean() as any;

    if (!receipt) {
      return NextResponse.json({ success: false, error: "not found" }, { status: 404 });
    }

    // Find matches involving this receipt
    const matches = await Match.find({
      userId: session.userId,
      $or: [{ receiptA: id }, { receiptB: id }],
    }).lean() as any[];

    // Get other receipt info from matches
    const otherIds = matches.map((m: any) =>
      String(m.receiptA) === id ? m.receiptB : m.receiptA
    );
    const otherReceipts = otherIds.length
      ? await Receipt.find({ _id: { $in: otherIds } }).select("merchant").lean()
      : [];
    const otherMap: Record<string, string> = {};
    (otherReceipts as any[]).forEach((r: any) => {
      otherMap[String(r._id)] = r.merchant || "ไม่ระบุ";
    });

    // Determine which pages this receipt appears on
    const dir = receipt.direction || "expense";
    const pages: { label: string; color: string }[] = [
      { label: "ใบเสร็จ/เอกสาร (ทั้งหมด)", color: "#FA3633" },
    ];

    if (dir === "income") pages.push({ label: "รายรับ", color: "#22c55e" });
    else if (dir === "savings") pages.push({ label: "เงินออม", color: "#ec4899" });
    else pages.push({ label: "รายจ่าย", color: "#ef4444" });

    if (matches.length > 0) pages.push({ label: "สแกน & จับคู่", color: "#06b6d4" });
    if (receipt.status === "duplicate") pages.push({ label: "ตรวจเอกสารซ้ำ", color: "#f97316" });

    const dateStr = receipt.date
      ? new Date(receipt.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
      : "-";

    return NextResponse.json({
      success: true,
      receipt: {
        merchant: receipt.merchant || "ไม่ระบุ",
        amount: receipt.amount || 0,
        date: dateStr,
        category: receipt.category || "-",
        status: receipt.status || "pending",
      },
      direction: dir,
      pages,
      matches: matches.map((m: any) => ({
        _id: String(m._id),
        otherMerchant: otherMap[String(m.receiptA) === id ? m.receiptB : m.receiptA] || "ไม่ระบุ",
        matchType: m.matchType === "auto" ? "อัตโนมัติ" : m.matchType === "email" ? "อีเมล" : "กำหนดเอง",
      })),
    });
  });
}
