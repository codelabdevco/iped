import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import ExpensesClient from "./ExpensesClient";

async function ExpensesData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const receipts = await Receipt.find({ userId: session.userId, direction: { $in: ["expense", undefined, null] } })
    .select("-imageUrl -ocrRawText")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const data = receipts.map((r: any) => ({
    _id: String(r._id),
    storeName: r.merchant || r.storeName || "ไม่ระบุ",
    amount: r.amount || 0,
    category: r.category || "ไม่ระบุ",
    rawDate: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
    date: r.date ? new Date(r.date).toLocaleDateString("th-TH") : "",
    time: r.time || "",
    status: r.status || "pending",
    source: r.source || "web",
    paymentMethod: r.paymentMethod || "",
    note: r.note || "",
    hasImage: !!r.imageHash,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
  }));

  return <ExpensesClient expenses={data} />;
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <ExpensesData />
    </Suspense>
  );
}
