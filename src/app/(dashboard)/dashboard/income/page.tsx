import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import IncomeClient from "./IncomeClient";

export default async function IncomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const documents = await DocumentModel.find({
    userId: session.userId,
    direction: "income",
  })
    .sort({ date: -1 })
    .limit(100)
    .lean();

  // Calculate this month and last month totals
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let thisMonth = 0;
  let lastMonth = 0;
  for (const d of documents) {
    const date = new Date(d.date);
    if (date >= thisMonthStart) thisMonth += d.amount;
    else if (date >= lastMonthStart) lastMonth += d.amount;
  }

  const incomes = documents.map((d) => ({
    _id: String(d._id),
    date: d.date.toISOString(),
    merchant: d.merchant,
    category: d.category,
    categoryIcon: d.categoryIcon || "💰",
    amount: d.amount,
    note: d.note || undefined,
    paymentMethod: d.paymentMethod || undefined,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
  }));

  return <IncomeClient incomes={incomes} thisMonth={thisMonth} lastMonth={lastMonth} />;
}
