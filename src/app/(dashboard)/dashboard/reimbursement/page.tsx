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

  // Find business receipts that came from personal (ค่าใช้จ่ายบริษัท)
  const receipts = await Receipt.find({
    userId: session.userId,
    accountType: "business",
  })
    .select("-imageUrl -ocrRawText")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const data = receipts.map((r: any) => ({
    _id: String(r._id),
    merchant: r.merchant || "ไม่ระบุ",
    amount: r.amount || 0,
    category: r.category || "ไม่ระบุ",
    date: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    status: r.status || "pending",
    source: r.source || "web",
    note: r.note || "",
    direction: r.direction || "expense",
    hasImage: !!r.imageHash,
  }));

  return <ReimbursementClient receipts={serialize(data)} />;
}

export default function ReimbursementPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-40 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <ReimbursementData />
    </Suspense>
  );
}
