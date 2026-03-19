export const dynamic = "force-dynamic";

import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import User from "@/models/User";
import DashboardClient from "./DashboardClient";
import { getAccountMode } from "@/lib/mode";

interface JwtPayload {
  userId: string;
}

async function getDashboardData(userId: string) {
  await connectDB();
  const accountType = await getAccountMode();
  const mf = { userId, accountType };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentMonthReceipts, lastMonthReceipts, recentReceipts] =
    await Promise.all([
      Receipt.find({ ...mf, createdAt: { $gte: startOfMonth } })
        .sort({ createdAt: -1 })
        .lean(),
      Receipt.find({
        ...mf,
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }).lean(),
      Receipt.find(mf).sort({ createdAt: -1 }).limit(10).lean(),
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

  // Monthly trend (12 months) with per-category breakdown — single aggregation
  const allCategoryMap: Record<string, number> = {};
  const monthlyAgg = await Receipt.aggregate([
    {
      $match: {
        userId,
        accountType,
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
          category: "$category",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const monthlyTrend = Array.from({ length: 12 }, (_, i) => 11 - i).map((i) => {
    const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthNum = ms.getMonth() + 1;
    const yearNum = ms.getFullYear();
    const monthName = ms.toLocaleDateString("th-TH", { month: "short" });

    const categories: Record<string, number> = {};
    let total = 0;
    monthlyAgg
      .filter((r: any) => r._id.month === monthNum && r._id.year === yearNum)
      .forEach((r: any) => {
        const cat = r._id.category || "ไม่ระบุ";
        categories[cat] = (categories[cat] || 0) + r.total;
        allCategoryMap[cat] = (allCategoryMap[cat] || 0) + r.total;
        total += r.total;
      });

    return { month: monthName, categories, total };
  });

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

  // Payment method breakdown
  const paymentMap: Record<string, number> = {};
  [...currentMonthReceipts, ...lastMonthReceipts, ...recentReceipts].forEach((r) => {
    const pm = r.paymentMethod || "other";
    paymentMap[pm] = (paymentMap[pm] || 0) + (r.amount || 0);
  });

  // Connection status
  const user = await User.findById(userId)
    .select("lineUserId googleAccessToken googleEmail")
    .lean() as any;
  const connections = {
    line: !!user?.lineUserId,
    gmail: !!user?.googleAccessToken,
    drive: !!user?.googleAccessToken,
    sheets: false,
    notion: false,
  };

  // Savings by category (real data)
  const savingsReceipts = await Receipt.find({ userId, accountType, direction: "savings", status: { $nin: ["cancelled", "draft"] } })
    .select("amount category")
    .lean();
  const savingsByCategory: Record<string, number> = {};
  (savingsReceipts as any[]).forEach((r: any) => {
    const cat = r.category || "เงินออม";
    savingsByCategory[cat] = (savingsByCategory[cat] || 0) + (r.amount || 0);
  });

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
    paymentData: paymentMap,
    connections,
    savingsByCategory,
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
