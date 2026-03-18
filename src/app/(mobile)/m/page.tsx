import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import User from "@/models/User";
import MobileHomeClient from "./MobileHomeClient";

export default async function MobileHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const user = await User.findById(session.userId).select("monthlyBudget lineDisplayName").lean() as any;

  const [todayReceipts, monthExpense, monthIncome, recentReceipts] = await Promise.all([
    Receipt.find({ userId: session.userId, date: { $gte: todayStart }, status: { $ne: "cancelled" } })
      .select("merchant amount category categoryIcon direction paymentMethod date time")
      .sort({ createdAt: -1 }).lean(),
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: monthStart }, direction: { $ne: "income" }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: monthStart }, direction: "income", status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Receipt.find({ userId: session.userId, status: { $ne: "cancelled" } })
      .select("merchant amount category categoryIcon direction paymentMethod date time status source imageHash")
      .sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const todayExpense = todayReceipts.filter((r: any) => r.direction !== "income").reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const todayIncome = todayReceipts.filter((r: any) => r.direction === "income").reduce((s: number, r: any) => s + (r.amount || 0), 0);

  const data = {
    displayName: user?.lineDisplayName || "User",
    todayExpense,
    todayIncome,
    todayCount: todayReceipts.length,
    monthExpense: monthExpense[0]?.total || 0,
    monthIncome: monthIncome[0]?.total || 0,
    monthlyBudget: user?.monthlyBudget || 0,
    recentReceipts: recentReceipts.map((r: any) => ({
      _id: String(r._id),
      merchant: r.merchant || "ไม่ระบุ",
      amount: r.amount || 0,
      category: r.category || "",
      categoryIcon: r.categoryIcon || "📦",
      direction: r.direction || "expense",
      paymentMethod: r.paymentMethod || "",
      date: r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "",
      time: r.time || "",
      status: r.status || "pending",
      hasImage: !!r.imageHash,
    })),
  };

  return <MobileHomeClient data={data} />;
}
