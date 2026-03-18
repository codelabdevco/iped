import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import InvoicesClient from "./InvoicesClient";

async function InvoicesData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const now = new Date();
  const docs = await DocumentModel.find({
    userId: session.userId,
    type: "invoice",
    direction: "income",
  })
    .select("documentNumber merchant note category amount date dueDate status")
    .sort({ date: -1 })
    .limit(100)
    .lean();

  const data = docs.map((d: any) => {
    const isOverdue = d.status === "overdue" || (d.dueDate && new Date(d.dueDate) < now && d.status !== "paid");
    let status = "ค้างชำระ";
    if (d.status === "paid") status = "ชำระแล้ว";
    else if (isOverdue) status = "เกินกำหนด";

    return {
      _id: String(d._id),
      id: d.documentNumber || String(d._id).slice(-8).toUpperCase(),
      customer: d.merchant || "ไม่ระบุ",
      item: d.note || d.category || "ไม่ระบุ",
      amount: d.amount || 0,
      rawIssued: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
      issued: d.date ? new Date(d.date).toLocaleDateString("th-TH") : "",
      rawDue: d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 10) : "",
      due: d.dueDate ? new Date(d.dueDate).toLocaleDateString("th-TH") : "-",
      status,
    };
  });

  return <InvoicesClient invoices={data} />;
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <InvoicesData />
    </Suspense>
  );
}
