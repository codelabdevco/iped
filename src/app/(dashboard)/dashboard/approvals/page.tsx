import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import ApprovalsClient from "./ApprovalsClient";

const statusMap: Record<string, string> = {
  awaiting_approval: "รออนุมัติ",
  confirmed: "อนุมัติ",
  paid: "อนุมัติ",
  rejected: "ปฏิเสธ",
};

async function ApprovalsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const docs = await DocumentModel.find({
    userId: session.userId,
    status: { $in: ["awaiting_approval", "confirmed", "paid", "rejected"] },
  })
    .select("merchant amount category date status")
    .sort({ date: -1 })
    .limit(100)
    .lean();

  const data = docs.map((d: any) => ({
    _id: String(d._id),
    requester: d.merchant || "ไม่ระบุ",
    item: d.category || "ไม่ระบุ",
    amount: d.amount || 0,
    category: d.category || "ไม่ระบุ",
    rawDate: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
    date: d.date ? new Date(d.date).toLocaleDateString("th-TH") : "",
    status: statusMap[d.status] || "รออนุมัติ",
  }));

  return <ApprovalsClient approvals={data} />;
}

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <ApprovalsData />
    </Suspense>
  );
}
