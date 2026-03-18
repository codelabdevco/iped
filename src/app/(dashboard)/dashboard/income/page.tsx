import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import IncomeClient from "./IncomeClient";
import { getAccountMode } from "@/lib/mode";
import { serializeReceipt } from "@/lib/serialize";

async function IncomeData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const accountType = await getAccountMode();
  const receipts = await Receipt.find({ userId: session.userId, accountType, direction: "income" })
    .select("-imageUrl -ocrRawText")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const data = receipts.map((r: any) =>
    serializeReceipt(r, { category: "อื่นๆ", status: "confirmed" })
  );

  return <IncomeClient incomes={data} />;
}

export default function IncomePage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <IncomeData />
    </Suspense>
  );
}
