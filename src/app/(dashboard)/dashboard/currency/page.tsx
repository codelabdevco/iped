import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import CurrencyClient from "./CurrencyClient";

function formatDate(d?: Date | null): string {
  if (!d) return "-";
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

async function CurrencyData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const docs = await Document.find({
    userId: session.userId,
    currency: { $ne: "THB" },
  })
    .sort({ date: -1 })
    .lean();

  const transactions = docs.map((doc: any) => ({
    id: doc._id.toString(),
    date: formatDate(doc.date),
    desc: doc.merchant || "ไม่ระบุ",
    currency: doc.currency || "USD",
    amount: doc.amount || 0,
    thb: doc.amountTHB || Math.round(doc.amount * (doc.exchangeRate || 1)),
  }));

  return <CurrencyClient transactions={transactions} />;
}

export default function CurrencyPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <CurrencyData />
    </Suspense>
  );
}
