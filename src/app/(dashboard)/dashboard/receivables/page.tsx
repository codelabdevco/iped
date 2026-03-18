import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import ReceivablesClient from "./ReceivablesClient";

async function ReceivablesData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const docs = await Document.find({
    userId: session.userId,
    direction: "income",
    type: { $in: ["invoice", "billing", "debit_note"] },
    status: { $nin: ["paid", "cancelled"] },
  })
    .select("-imageUrl -ocrRawText")
    .sort({ dueDate: 1 })
    .limit(200)
    .lean();

  const now = new Date();

  const data = docs.map((d: any) => {
    const dueDate = d.dueDate ? new Date(d.dueDate) : null;
    const overdueDays = dueDate
      ? Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    let displayStatus: "ปกติ" | "เกินกำหนด" | "ค้างชำระ" = "ปกติ";
    if (overdueDays > 90) displayStatus = "ค้างชำระ";
    else if (overdueDays > 0) displayStatus = "เกินกำหนด";

    return {
      _id: String(d._id),
      customer: d.merchant || "ไม่ระบุ",
      invoiceNo: d.documentNumber || "-",
      amount: d.amount || 0,
      dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : "",
      overdueDays,
      status: displayStatus,
    };
  });

  return <ReceivablesClient items={data} />;
}

export default function ReceivablesPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <ReceivablesData />
    </Suspense>
  );
}
