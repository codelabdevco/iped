import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getAccountMode } from "@/lib/mode";
import Receipt from "@/models/Receipt";
import ReportsClient from "./ReportsClient";

async function ReportsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const accountType = await getAccountMode();
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [monthlyAgg, categoryAgg, merchantAgg, compAgg, paymentAgg] = await Promise.all([
    Receipt.aggregate([
      { $match: { userId: session.userId, accountType, date: { $gte: twelveMonthsAgo }, status: { $ne: "cancelled" } } },
      { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" }, direction: { $ifNull: ["$direction", "expense"] } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Receipt.aggregate([
      { $match: { userId: session.userId, accountType, direction: { $in: ["expense", null, undefined] }, date: { $gte: thisMonthStart }, status: { $ne: "cancelled" } } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }, { $limit: 10 },
    ]),
    Receipt.aggregate([
      { $match: { userId: session.userId, accountType, date: { $gte: thisMonthStart }, status: { $ne: "cancelled" } } },
      { $group: { _id: "$merchant", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }, { $limit: 5 },
    ]),
    Receipt.aggregate([
      { $match: { userId: session.userId, accountType, date: { $gte: lastMonthStart }, status: { $ne: "cancelled" } } },
      { $group: { _id: { month: { $month: "$date" }, direction: { $ifNull: ["$direction", "expense"] } }, total: { $sum: "$amount" } } },
    ]),
    Receipt.aggregate([
      { $match: { userId: session.userId, accountType, date: { $gte: thisMonthStart }, status: { $ne: "cancelled" } } },
      { $group: { _id: { $ifNull: ["$paymentMethod", "other"] }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  const income: number[] = Array(12).fill(0);
  const expense: number[] = Array(12).fill(0);
  const savings: number[] = Array(12).fill(0);
  for (const item of monthlyAgg) {
    const idx = (item._id.year - now.getFullYear()) * 12 + (item._id.month - 1) - (now.getMonth() - 11);
    if (idx >= 0 && idx < 12) {
      if (item._id.direction === "income") income[idx] = item.total;
      else if (item._id.direction === "savings") savings[idx] = item.total;
      else expense[idx] = item.total;
    }
  }

  const catTotal = categoryAgg.reduce((s: number, c: any) => s + c.total, 0);
  const categories = categoryAgg.map((c: any) => ({ name: c._id || "ไม่ระบุ", amount: c.total, pct: catTotal > 0 ? Math.round((c.total / catTotal) * 1000) / 10 : 0, count: c.count }));
  const topMerchants = merchantAgg.map((m: any) => ({ name: m._id || "ไม่ระบุ", total: m.total, count: m.count }));
  const topPayments = paymentAgg.map((p: any) => ({ method: p._id, total: p.total, count: p.count }));

  const thisMonthNum = now.getMonth() + 1;
  let thisIncome = 0, lastIncome = 0, thisExpense = 0, lastExpense = 0, thisSavings = 0;
  for (const c of compAgg) {
    if (c._id.month === thisMonthNum) {
      if (c._id.direction === "income") thisIncome = c.total;
      else if (c._id.direction === "savings") thisSavings = c.total;
      else thisExpense = c.total;
    } else {
      if (c._id.direction === "income") lastIncome = c.total;
      else lastExpense = c.total;
    }
  }

  return <ReportsClient monthly={{ income, expense, savings }} categories={categories} topMerchants={topMerchants} topPayments={topPayments} comparison={{ thisMonth: { income: thisIncome, expense: thisExpense, savings: thisSavings }, lastMonth: { income: lastIncome, expense: lastExpense } }} />;
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-40 rounded-lg bg-white/[0.06]" /><div className="h-60 rounded-2xl bg-white/[0.04]" /></div>}>
      <ReportsData />
    </Suspense>
  );
}
