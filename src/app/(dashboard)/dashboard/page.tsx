import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import DashboardClient from "./DashboardClient";

interface JwtPayload {
  userId: string;
}

async function getDashboardData(userId: string) {
  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentMonthReceipts, lastMonthReceipts, recentReceipts] =
    await Promise.all([
      Receipt.find({ userId, createdAt: { $gte: startOfMonth } })
        .sort({ createdAt: -1 })
        .lean(),
      Receipt.find({
        userId,
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }).lean(),
      Receipt.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

  const totalThisMonth = currentMonthReceipts.reduce(
    (s, r) => s + (r.amount || 0),
    0
  );
  const totalLastMonth = lastMonthReceipts.reduce(
    (s, r) => s + (r.amount || 0),
    0
  );
  const changePercent =
    totalLastMonth > 0
      ? Math.round(
          ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
        )
      : 0;

  // Monthly trend (12 months) with per-category breakdown
  const allCategoryMap: Record<string, number> = {};
  const monthlyTrend = await Promise.all(
    Array.from({ length: 12 }, (_, i) => 11 - i).map(async (i) => {
      const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const recs = await Receipt.find({
        userId,
        createdAt: { $gte: ms, $lte: me },
      }).lean();

      const categories: Record<string, number> = {};
      let total = 0;
      recs.forEach((r) => {
        const cat = r.category || "ไม่ระบุ";
        const amt = r.amount || 0;
        categories[cat] = (categories[cat] || 0) + amt;
        allCategoryMap[cat] = (allCategoryMap[cat] || 0) + amt;
        total += amt;
      });

      return {
        month: ms.toLocaleDateString("th-TH", { month: "short" }),
        categories,
        total,
      };
    })
  );

  const serialize = (recs: typeof recentReceipts) =>
    recs.map((r) => ({
      _id: String(r._id),
      storeName: r.merchant || "ไม่ระบุร้าน",
      amount: r.amount || 0,
      category: r.category || "ไม่ระบุ",
      date: r.date
        ? new Date(r.date).toLocaleDateString("th-TH")
        : new Date(r.createdAt).toLocaleDateString("th-TH"),
      status: r.status || "pending",
      type: r.type || "receipt",
    }));

  return {
    totalAmount: totalThisMonth,
    changePercent,
    receiptCount: currentMonthReceipts.length,
    avgPerReceipt:
      currentMonthReceipts.length > 0
        ? Math.round(totalThisMonth / currentMonthReceipts.length)
        : 0,
    categoryCount: Object.keys(allCategoryMap).length,
    recentReceipts: serialize(recentReceipts),
    categoryData: allCategoryMap,
    monthlyData: monthlyTrend,
  };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) redirect("/login");

  const data = await getDashboardData(decoded.userId);
  return <DashboardClient data={data} />;
}
