import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import DuplicatesClient from "./DuplicatesClient";

async function DuplicatesData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  // Find potential duplicates: same amount + similar merchant + within 3 days
  const receipts = await Receipt.find({ userId: session.userId, status: { $ne: "cancelled" } })
    .select("merchant amount date time status source imageHash category createdAt")
    .sort({ date: -1 })
    .limit(200)
    .lean();

  // Group by amount + date proximity
  const groups: { receipts: any[]; similarity: number }[] = [];
  const used = new Set<string>();

  for (let i = 0; i < receipts.length; i++) {
    const a = receipts[i] as any;
    if (used.has(String(a._id))) continue;

    const matches: any[] = [a];
    for (let j = i + 1; j < receipts.length; j++) {
      const b = receipts[j] as any;
      if (used.has(String(b._id))) continue;

      // Same amount
      if (a.amount !== b.amount || a.amount === 0) continue;

      // Date within 3 days
      const dateA = a.date ? new Date(a.date) : new Date(a.createdAt);
      const dateB = b.date ? new Date(b.date) : new Date(b.createdAt);
      const daysDiff = Math.abs(dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 3) continue;

      // Merchant similarity
      const sim = merchantSimilarity(a.merchant || "", b.merchant || "");
      if (sim < 0.5) continue;

      matches.push(b);
    }

    if (matches.length > 1) {
      matches.forEach((m) => used.add(String(m._id)));
      const sim = matches.length === 2
        ? Math.round(merchantSimilarity(matches[0].merchant || "", matches[1].merchant || "") * 100)
        : 90;
      groups.push({ receipts: matches, similarity: Math.max(sim, 80) });
    }
  }

  // Also include receipts already marked as "duplicate"
  const markedDups = receipts.filter((r: any) => r.status === "duplicate" && !used.has(String(r._id)));

  const data = groups.map((g, i) => ({
    id: `DG-${i}`,
    similarity: g.similarity,
    docs: g.receipts.map((r: any) => ({
      _id: String(r._id),
      merchant: r.merchant || "ไม่ระบุ",
      amount: r.amount || 0,
      date: r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }) : "",
      time: r.time || "",
      status: r.status || "pending",
      source: r.source || "web",
      hasImage: !!r.imageHash,
    })),
  }));

  // Add standalone duplicates
  markedDups.forEach((r: any, i: number) => {
    data.push({
      id: `DS-${i}`,
      similarity: 100,
      docs: [{
        _id: String(r._id),
        merchant: r.merchant || "ไม่ระบุ",
        amount: r.amount || 0,
        date: r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }) : "",
        time: r.time || "",
        status: "duplicate",
        source: r.source || "web",
        hasImage: !!r.imageHash,
      }],
    });
  });

  return <DuplicatesClient groups={data} />;
}

function merchantSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const al = a.toLowerCase().trim();
  const bl = b.toLowerCase().trim();
  if (al === bl) return 1;
  const bigrams = (s: string) => { const set = new Set<string>(); for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2)); return set; };
  const aSet = bigrams(al);
  const bSet = bigrams(bl);
  let intersection = 0;
  aSet.forEach((bg) => { if (bSet.has(bg)) intersection++; });
  return aSet.size + bSet.size > 0 ? (2 * intersection) / (aSet.size + bSet.size) : 0;
}

export default function DuplicatesPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-40 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <DuplicatesData />
    </Suspense>
  );
}
