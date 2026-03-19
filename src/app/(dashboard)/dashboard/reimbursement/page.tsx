export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import ReimbursementClient from "./ReimbursementClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function ReimbursementData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const userId = session.userId;

  // Find reimbursement receipts (business receipts transferred from personal)
  const receipts = await Receipt.find({
    userId,
    accountType: "business",
    $or: [
      { note: { $regex: "เบิกจ่ายจากส่วนตัว" } },
      { status: "pending", direction: "expense" },
    ],
  })
    .select("merchant amount category categoryIcon date status source direction note createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const rows = receipts.map((r: any) => ({
    _id: String(r._id),
    merchant: r.merchant || "ไม่ระบุ",
    category: r.category || "",
    categoryIcon: r.categoryIcon || "📋",
    amount: r.amount || 0,
    date: r.date ? new Date(r.date).toISOString() : r.createdAt ? new Date(r.createdAt).toISOString() : "",
    status: r.status as string,
    source: r.source || "web",
    note: r.note || "",
  }));

  const stats = {
    totalPending: rows.filter((r) => r.status === "pending").length,
    totalAmount: rows.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.amount, 0),
    totalApproved: rows.filter((r) => r.status === "confirmed").length,
    totalRejected: rows.filter((r) => r.status === "cancelled").length,
  };

  return (
    <ReimbursementClient
      receipts={serialize(rows)}
      stats={stats}
    />
  );
}

export default function ReimbursementPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <ReimbursementData />
    </Suspense>
  );
}
