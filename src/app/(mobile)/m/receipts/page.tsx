import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import MobileReceiptsClient from "./MobileReceiptsClient";

export default async function MobileReceiptsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const receipts = await Receipt.find({ userId: session.userId, status: { $ne: "cancelled" } })
    .select("merchant amount category categoryIcon direction paymentMethod date time status source imageHash createdAt")
    .sort({ createdAt: -1 }).limit(100).lean();

  const data = receipts.map((r: any) => ({
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
    source: r.source || "web",
    hasImage: !!r.imageHash,
  }));

  return <MobileReceiptsClient receipts={data} />;
}
