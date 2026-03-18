import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getAccountMode } from "@/lib/mode";
import Receipt from "@/models/Receipt";
import BudgetClient from "./BudgetClient";

async function BudgetData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const accountType = await getAccountMode();

  // Get this month's spending by category
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const spendingByCategory = await Receipt.aggregate([
    {
      $match: {
        userId: session.userId,
        accountType,
        direction: { $in: ["expense", null, undefined] },
        status: { $ne: "cancelled" },
        date: { $gte: thisMonthStart },
      },
    },
    {
      $group: {
        _id: "$category",
        spent: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { spent: -1 } },
  ]);

  const spending = spendingByCategory.map((s: any) => ({
    category: s._id || "ไม่ระบุ",
    spent: s.spent,
    count: s.count,
  }));

  return <BudgetClient spending={spending} />;
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <BudgetData />
    </Suspense>
  );
}
