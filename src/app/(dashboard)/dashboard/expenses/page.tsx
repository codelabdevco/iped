import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const documents = await DocumentModel.find({
    userId: session.userId,
    direction: "expense",
  })
    .sort({ date: -1 })
    .limit(100)
    .lean();

  const statsAgg = await DocumentModel.aggregate([
    { $match: { userId: session.userId, direction: "expense" } },
    { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  const stats = statsAgg[0] || { totalAmount: 0, count: 0 };

  const expenses = documents.map((d) => ({
    _id: String(d._id),
    date: d.date.toISOString(),
    merchant: d.merchant,
    category: d.category,
    categoryIcon: d.categoryIcon || "📋",
    amount: d.amount,
    paymentMethod: d.paymentMethod || undefined,
    status: d.status,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
  }));

  return <ExpensesClient expenses={expenses} stats={{ totalAmount: stats.totalAmount, count: stats.count }} />;
}
