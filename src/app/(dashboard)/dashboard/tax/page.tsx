import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import TaxClient from "./TaxClient";

async function TaxData() {
  const session = await getSession();
  if (!session) redirect("/login");
  await connectDB();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // VAT aggregation for current month
  const vatAgg = await DocumentModel.aggregate([
    {
      $match: {
        userId: new (await import("mongoose")).default.Types.ObjectId(session.userId),
        date: { $gte: monthStart },
      },
    },
    {
      $group: {
        _id: "$direction",
        totalVat: { $sum: { $ifNull: ["$vat", 0] } },
      },
    },
  ]);

  const salesVat = vatAgg.find((v: any) => v._id === "income")?.totalVat || 0;
  const purchaseVat = vatAgg.find((v: any) => v._id === "expense")?.totalVat || 0;

  // WHT records
  const whtDocs = await DocumentModel.find({
    userId: session.userId,
    wht: { $gt: 0 },
  })
    .select("merchant whtRate wht date status")
    .sort({ date: -1 })
    .limit(50)
    .lean();

  const whtData = whtDocs.map((d: any) => ({
    _id: String(d._id),
    name: d.merchant || "ไม่ระบุ",
    rate: d.whtRate || 3,
    amount: d.wht,
    date: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
    status: d.status === "paid" ? "ยื่นแล้ว" : "รอยื่น",
  }));

  return <TaxClient vat={{ sales: salesVat, purchase: purchaseVat, net: salesVat - purchaseVat }} wht={whtData} />;
}

export default function TaxPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-32 rounded-lg bg-white/[0.06]" />
          <div className="h-40 rounded-2xl bg-white/[0.04]" />
        </div>
      }
    >
      <TaxData />
    </Suspense>
  );
}
