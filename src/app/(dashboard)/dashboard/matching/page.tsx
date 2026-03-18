import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import Match from "@/models/Match";
import MatchingClient from "./MatchingClient";

async function MatchingData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const [receipts, matches] = await Promise.all([
    Receipt.find({ userId: session.userId })
      .select("-imageUrl -ocrRawText")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Match.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const receiptMap: Record<string, any> = {};
  const data = receipts.map((r: any) => {
    const obj = {
      _id: String(r._id),
      storeName: r.merchant || "ไม่ระบุ",
      amount: r.amount || 0,
      category: r.category || "ไม่ระบุ",
      rawDate: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
      date: r.date ? new Date(r.date).toLocaleDateString("th-TH") : "",
      time: r.time || "",
      status: r.status || "pending",
      type: r.type || "receipt",
      source: r.source || "web",
      paymentMethod: r.paymentMethod || "",
      note: r.note || "",
      hasImage: !!r.imageHash,
      direction: r.direction || "expense",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    };
    receiptMap[obj._id] = obj;
    return obj;
  });

  const matchData = matches.map((m: any) => ({
    _id: String(m._id),
    receiptA: receiptMap[m.receiptA] || { _id: m.receiptA, storeName: "?", amount: 0 },
    receiptB: receiptMap[m.receiptB] || { _id: m.receiptB, storeName: "?", amount: 0 },
    matchScore: m.matchScore,
    matchType: m.matchType,
    matchReason: m.matchReason,
    status: m.status,
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : "",
  }));

  return <MatchingClient receipts={data} matches={matchData} />;
}

export default function MatchingPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-40 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <MatchingData />
    </Suspense>
  );
}
