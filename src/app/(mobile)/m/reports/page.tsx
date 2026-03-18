import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import MobileReportsClient from "./MobileReportsClient";

export default async function MobileReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Category breakdown
  const catBreakdown = await Receipt.aggregate([
    { $match: { userId: session.userId, date: { $gte: monthStart }, direction: { $ne: "income" }, status: { $ne: "cancelled" } } },
    { $group: { _id: "$category", icon: { $first: "$categoryIcon" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);

  // Monthly totals (last 6 months)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyTotals = await Receipt.aggregate([
    { $match: { userId: session.userId, date: { $gte: sixMonthsAgo }, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: { month: { $month: "$date" }, year: { $year: "$date" }, direction: { $ifNull: ["$direction", "expense"] } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const monthlyData: { month: string; expense: number; income: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const exp = monthlyTotals.find((t: any) => t._id.month === m && t._id.year === y && t._id.direction !== "income")?.total || 0;
    const inc = monthlyTotals.find((t: any) => t._id.month === m && t._id.year === y && t._id.direction === "income")?.total || 0;
    monthlyData.push({ month: months[d.getMonth()], expense: exp, income: inc });
  }

  const data = {
    categories: catBreakdown.map((c: any) => ({
      name: c._id || "อื่นๆ",
      icon: c.icon || "📦",
      total: c.total,
      count: c.count,
    })),
    monthlyData,
    totalExpense: catBreakdown.reduce((s: number, c: any) => s + c.total, 0),
  };

  return <MobileReportsClient data={data} />;
}
