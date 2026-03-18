import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import PaymentsClient from "./PaymentsClient";

async function PaymentsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const agg = await Receipt.aggregate([
    { $match: { userId: session.userId, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: { $ifNull: ["$paymentMethod", "other"] },
        count: { $sum: 1 },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const payments = agg.map((item: any) => ({
    method: item._id || "other",
    count: item.count,
    total: item.total,
  }));

  return <PaymentsClient payments={payments} />;
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <PaymentsData />
    </Suspense>
  );
}
