import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import QuotationsClient from "./QuotationsClient";

async function QuotationsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const now = new Date();
  const docs = await DocumentModel.find({
    userId: session.userId,
    type: "quotation",
  })
    .select("documentNumber merchant category amount date dueDate status")
    .sort({ date: -1 })
    .limit(100)
    .lean();

  const data = docs.map((d: any) => {
    const expired = d.dueDate && new Date(d.dueDate) < now;
    let status = "ร่าง";
    if (d.status === "pending") status = "ส่งแล้ว";
    else if (d.status === "confirmed") status = "อนุมัติ";
    else if (d.status === "rejected") status = "ปฏิเสธ";
    if (expired && status !== "อนุมัติ" && status !== "ปฏิเสธ") status = "หมดอายุ";

    return {
      _id: String(d._id),
      id: d.documentNumber || String(d._id).slice(-8).toUpperCase(),
      customer: d.merchant || "ไม่ระบุ",
      item: d.category || "ไม่ระบุ",
      amount: d.amount || 0,
      rawDate: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
      date: d.date ? new Date(d.date).toLocaleDateString("th-TH") : "",
      rawExpires: d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 10) : "",
      expires: d.dueDate ? new Date(d.dueDate).toLocaleDateString("th-TH") : "-",
      status,
    };
  });

  return <QuotationsClient quotations={data} />;
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <QuotationsData />
    </Suspense>
  );
}
