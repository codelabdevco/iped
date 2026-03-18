import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import DocumentModel from "@/models/Document";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.userId);

    // Monthly income/expense for last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const monthlyAgg = await DocumentModel.aggregate([
      {
        $match: {
          userId,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            direction: "$direction",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Build monthly arrays
    const incomeByMonth: number[] = Array(12).fill(0);
    const expenseByMonth: number[] = Array(12).fill(0);
    for (const item of monthlyAgg) {
      const monthIndex = (item._id.year - now.getFullYear()) * 12 + (item._id.month - 1) - (now.getMonth() - 11);
      if (monthIndex >= 0 && monthIndex < 12) {
        if (item._id.direction === "income") incomeByMonth[monthIndex] = item.total;
        else expenseByMonth[monthIndex] = item.total;
      }
    }

    // Category breakdown (this month expenses)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const categoryAgg = await DocumentModel.aggregate([
      {
        $match: {
          userId,
          direction: "expense",
          date: { $gte: thisMonthStart },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    const catTotal = categoryAgg.reduce((s, c) => s + c.total, 0);
    const categories = categoryAgg.map((c) => ({
      name: c._id,
      amount: c.total,
      count: c.count,
      pct: catTotal > 0 ? Math.round((c.total / catTotal) * 1000) / 10 : 0,
    }));

    // Top merchants (this month)
    const merchantAgg = await DocumentModel.aggregate([
      {
        $match: {
          userId,
          direction: "expense",
          date: { $gte: thisMonthStart },
        },
      },
      {
        $group: {
          _id: "$merchant",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    const topMerchants = merchantAgg.map((m) => ({
      name: m._id,
      total: m.total,
      count: m.count,
    }));

    // This month vs last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const compAgg = await DocumentModel.aggregate([
      {
        $match: {
          userId,
          date: { $gte: lastMonthStart },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            direction: "$direction",
          },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const thisMonthNum = now.getMonth() + 1;
    let thisIncome = 0, lastIncome = 0, thisExpense = 0, lastExpense = 0;
    for (const c of compAgg) {
      if (c._id.month === thisMonthNum) {
        if (c._id.direction === "income") thisIncome = c.total;
        else thisExpense = c.total;
      } else {
        if (c._id.direction === "income") lastIncome = c.total;
        else lastExpense = c.total;
      }
    }

    return apiSuccess({
      monthly: { income: incomeByMonth, expense: expenseByMonth },
      categories,
      topMerchants,
      comparison: {
        thisMonth: { income: thisIncome, expense: thisExpense },
        lastMonth: { income: lastIncome, expense: lastExpense },
      },
    });
  });
}
