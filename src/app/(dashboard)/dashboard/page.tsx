import { cookies } from "next/headers";

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
      ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100)
      : 0;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  currentMonthReceipts.forEach((r) => {
    const cat = r.category || "ไม่ระบุ";
    categoryMap[cat] = (categoryMap[cat] || 0) + (r.amount || 0);
  });
  const categories = Object.entries(categoryMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly trend (6 months)
  const monthlyTrend = await Promise.all(
    Array.from({ length: 6 }, (_, i) => 5 - i).map(async (i) => {
      const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const recs = await Receipt.find({
        userId,
        createdAt: { $gte: ms, $lte: me },
      }).lean();
      return {
        month: ms.toLocaleDateString("th-TH", { month: "short" }),
        amount: recs.reduce((s, r) => s + (r.amount || 0), 0),
        count: recs.length,
      };
    })
  );

  const serialize = (recs: typeof recentReceipts) =>
    recs.map((r) => ({
      _id: String(r._id),
      storeName: r.storeName || "ไม่ระบุร้าน",
      amount: r.amount || 0,
      category: r.category || "ไม่ระบุ",
      date: r.date
        ? new Date(r.date).toLocaleDateString("th-TH")
        : new Date(r.createdAt).toLocaleDateString("th-TH"),
      status: r.status || "pending",
      type: r.type || "receipt",
    }));

  return {
    stats: {
      totalThisMonth,
      changePercent,
      receiptCount: currentMonthReceipts.length,
      receiptCountChange:
        lastMonthReceipts.length > 0
          ? Math.round(
              ((currentMonthReceipts.length - lastMonthReceipts.length) /
                lastMonthReceipts.length) *
                100
            )
          : 0,
      averageAmount:
        currentMonthReceipts.length > 0
          ? Math.round(totalThisMonth / currentMonthReceipts.length)
          : 0,
    },
    recentReceipts: serialize(recentReceipts),
    categories,
    monthlyTrend,
  };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) return null;

  const user = await verifyToken(token);
  if (!user) redirect("/login");

  const data = await getDashboardData(decoded.userId);
  return <DashboardClient data={data} />;
}
