export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getAccountMode } from "@/lib/mode";
import Document from "@/models/Document";
import RecurringClient from "./RecurringClient";

const FREQ_MAP: Record<string, string> = {
  daily: "รายวัน",
  weekly: "รายสัปดาห์",
  monthly: "รายเดือน",
  yearly: "รายปี",
};

function formatDate(d?: Date | null): string {
  if (!d) return "-";
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

async function RecurringData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const accountType = await getAccountMode();

  const docs = await Document.find({
    userId: session.userId,
    accountType,
    isRecurring: true,
  }).lean();

  const data = docs.map((doc: any) => ({
    id: doc._id.toString(),
    name: doc.merchant || "ไม่ระบุ",
    type: doc.direction === "income" ? "income" : "expense",
    amount: doc.amount || 0,
    cycle: FREQ_MAP[doc.recurringPattern?.frequency || ""] || "รายเดือน",
    next: formatDate(doc.recurringPattern?.nextDate),
    active: doc.status !== "cancelled",
  }));

  const incomeTotal = data.filter((d) => d.type === "income").reduce((s, d) => s + d.amount, 0);
  const expenseTotal = data.filter((d) => d.type === "expense").reduce((s, d) => s + d.amount, 0);
  const activeCount = data.filter((d) => d.active).length;

  return <RecurringClient data={data} incomeTotal={incomeTotal} expenseTotal={expenseTotal} activeCount={activeCount} />;
}

export default function RecurringPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <RecurringData />
    </Suspense>
  );
}
