import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import SavingsClient from "./SavingsClient";
import { getAccountMode } from "@/lib/mode";
import { serializeReceipt } from "@/lib/serialize";

async function SavingsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const accountType = await getAccountMode();
  const receipts = await Receipt.find({ userId: session.userId, accountType, direction: "savings" })
    .select("-imageUrl -ocrRawText")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const data = receipts.map((r: any) =>
    serializeReceipt(r, {
      category: "เงินออม",
      status: "confirmed",
      extra: { type: r.type || "receipt" },
    })
  );

  return <SavingsClient savings={data} />;
}

export default function SavingsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <SavingsData />
    </Suspense>
  );
}
