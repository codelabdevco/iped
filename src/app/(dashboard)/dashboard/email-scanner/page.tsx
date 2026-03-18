import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import Match from "@/models/Match";
import User from "@/models/User";
import GoogleAccount from "@/models/GoogleAccount";
import EmailScannerClient from "./EmailScannerClient";

async function EmailScannerData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const [user, googleAccounts, docs] = await Promise.all([
    User.findById(session.userId)
      .select("googleEmail googleConnectedAt lastGmailScan autoGmailScan")
      .lean() as any,
    GoogleAccount.find({ userId: session.userId, status: "active" }).lean(),
    // Query from Receipt model (where Gmail scan actually saves data)
    Receipt.find({ userId: session.userId, source: "email" })
      .select("emailSubject emailFrom merchant amount date status ocrConfidence category note")
      .sort({ date: -1 })
      .limit(100)
      .lean(),
  ]);

  const accountsData = (googleAccounts as any[]).map((a: any) => ({
    _id: String(a._id),
    email: a.email,
    lastScanAt: a.lastScanAt ? new Date(a.lastScanAt).toISOString() : null,
    autoScan: a.autoScan,
  }));

  const totalScanned = docs.length;
  const totalWithOcr = docs.filter((d: any) => d.ocrConfidence && d.ocrConfidence > 0).length;

  // Query matches for email receipts
  const receiptIds = docs.map((d: any) => String(d._id));
  const matches = await Match.find({
    userId: session.userId,
    $or: [
      { receiptA: { $in: receiptIds } },
      { receiptB: { $in: receiptIds } },
    ],
  }).lean();

  // For each receipt, find its match
  const matchMap: Record<string, any> = {};
  for (const m of matches as any[]) {
    matchMap[m.receiptA] = m;
    matchMap[m.receiptB] = m;
  }

  const data = docs.map((d: any) => {
    const id = String(d._id);
    const match = matchMap[id];
    return {
      _id: id,
      emailSubject: d.emailSubject || d.note?.replace("จาก email: ", "") || d.merchant || "ไม่มีหัวข้อ",
      emailFrom: d.emailFrom || "",
      merchant: d.merchant || "",
      amount: d.amount || 0,
      category: d.category || "",
      date: d.date ? new Date(d.date).toLocaleDateString("th-TH") : "",
      rawDate: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
      status: d.status || "pending",
      ocrConfidence: d.ocrConfidence || 0,
      matchScore: match?.matchScore || 0,
      matchStatus: match?.status || null,
      matchedWith: match ? (match.receiptA === id ? match.receiptB : match.receiptA) : null,
    };
  });

  // Get matched receipt info
  const matchedIds = data.filter(d => d.matchedWith).map(d => d.matchedWith);
  const matchedReceipts = matchedIds.length > 0
    ? await Receipt.find({ _id: { $in: matchedIds } }).select("merchant source").lean()
    : [];
  const matchedMap: Record<string, any> = {};
  for (const r of matchedReceipts as any[]) {
    matchedMap[String(r._id)] = r;
  }

  // Add matched receipt info
  const finalData = data.map(d => ({
    ...d,
    matchedMerchant: d.matchedWith ? matchedMap[d.matchedWith]?.merchant || "" : "",
    matchedSource: d.matchedWith ? matchedMap[d.matchedWith]?.source || "" : "",
  }));

  return (
    <EmailScannerClient
      emails={finalData}
      googleEmail={user?.googleEmail || null}
      googleConnected={accountsData.length > 0 || !!user?.googleEmail}
      lastGmailScan={
        accountsData[0]?.lastScanAt ||
        (user?.lastGmailScan ? new Date(user.lastGmailScan).toISOString() : null)
      }
      autoGmailScan={accountsData[0]?.autoScan || user?.autoGmailScan || false}
      totalScanned={totalScanned}
      totalWithOcr={totalWithOcr}
      accounts={accountsData}
    />
  );
}

export default function EmailScannerPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
          <div className="h-20 rounded-2xl bg-white/[0.04]" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 rounded-2xl bg-white/[0.04]" />
            <div className="h-24 rounded-2xl bg-white/[0.04]" />
            <div className="h-24 rounded-2xl bg-white/[0.04]" />
          </div>
          <div className="h-40 rounded-2xl bg-white/[0.04]" />
        </div>
      }
    >
      <EmailScannerData />
    </Suspense>
  );
}
