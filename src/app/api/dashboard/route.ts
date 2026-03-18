import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("iped-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    await connectDB();
    const userId = (decoded as { userId: string }).userId;

    const now = new Date();
    const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), 0, 1);
    const to = toStr ? new Date(toStr) : now;
    to.setHours(23, 59, 59, 999);

    const periodMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodMs);
    const prevTo = new Date(from.getTime() - 1);

    const [currentReceipts, prevReceipts, recentReceipts] = await Promise.all([
      Receipt.find({ userId, createdAt: { $gte: from, $lte: to } }).sort({ createdAt: -1 }).lean(),
      Receipt.find({ userId, createdAt: { $gte: prevFrom, $lte: prevTo } }).lean(),
      Receipt.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const totalCurrent = currentReceipts.reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const totalPrev = prevReceipts.reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const changePercent = totalPrev > 0 ? Math.round(((totalCurrent - totalPrev) / totalPrev) * 100) : 0;

    const allCategoryMap: Record<string, number> = {};
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const months: { start: Date; end: Date; label: string }[] = [];

    let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    while (cursor <= toDate && months.length < 12) {
      const monthStart = new Date(cursor);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
      months.push({ start: monthStart, end: monthEnd, label: monthStart.toLocaleDateString("th-TH", { month: "short" }) });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    const monthlyTrend = await Promise.all(
      months.map(async (m) => {
        const recs = await Receipt.find({ userId, createdAt: { $gte: m.start, $lte: m.end } }).lean();
        const categories: Record<string, number> = {};
        let total = 0;
        recs.forEach((r: any) => {
          const cat = r.category || "ไม่ระบุ";
          const amt = r.amount || 0;
          categories[cat] = (categories[cat] || 0) + amt;
          allCategoryMap[cat] = (allCategoryMap[cat] || 0) + amt;
          total += amt;
        });
        return { month: m.label, categories, total };
      })
    );

    const serialize = (recs: any[]) =>
      recs.map((r) => ({
        _id: String(r._id),
        storeName: r.merchant || "ไม่ระบุร้าน",
        amount: r.amount || 0,
        category: r.category || "ไม่ระบุ",
        date: r.date ? new Date(r.date).toLocaleDateString("th-TH") : new Date(r.createdAt).toLocaleDateString("th-TH"),
        status: r.status || "pending",
        type: r.type || "receipt",
      }));

    // Connection status
    const user = await User.findById(userId).select("lineUserId googleAccessToken").lean() as any;
    const connections = {
      line: !!user?.lineUserId,
      gmail: !!user?.googleAccessToken,
      drive: !!user?.googleAccessToken,
      sheets: false,
      notion: false,
    };

    // Payment method breakdown
    const paymentMap: Record<string, number> = {};
    currentReceipts.forEach((r: any) => {
      const pm = r.paymentMethod || "other";
      paymentMap[pm] = (paymentMap[pm] || 0) + (r.amount || 0);
    });

    // Savings by category
    const savingsReceipts = await Receipt.find({ userId, direction: "savings", status: { $ne: "cancelled" } }).select("amount category").lean();
    const savingsByCategory: Record<string, number> = {};
    (savingsReceipts as any[]).forEach((r: any) => {
      const cat = r.category || "เงินออม";
      savingsByCategory[cat] = (savingsByCategory[cat] || 0) + (r.amount || 0);
    });

    return NextResponse.json({
      totalAmount: totalCurrent,
      changePercent,
      receiptCount: currentReceipts.length,
      avgPerReceipt: currentReceipts.length > 0 ? Math.round(totalCurrent / currentReceipts.length) : 0,
      categoryCount: Object.keys(allCategoryMap).length,
      recentReceipts: serialize(recentReceipts),
      categoryData: allCategoryMap,
      monthlyData: monthlyTrend,
      paymentData: paymentMap,
      connections,
      savingsByCategory,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
