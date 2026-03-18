export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import Match from "@/models/Match";
import User from "@/models/User";
import GoogleAccount from "@/models/GoogleAccount";
import FileModel from "@/models/File";
import MatchingClient from "./MatchingClient";

async function MatchingData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const [receipts, matches, user, googleAccounts] = await Promise.all([
    Receipt.find({ userId: session.userId })
      .select("-imageUrl -ocrRawText")
      .sort({ date: -1 })
      .limit(200)
      .lean(),
    Match.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    User.findById(session.userId)
      .select("googleEmail googleConnectedAt lastGmailScan autoGmailScan")
      .lean() as any,
    GoogleAccount.find({ userId: session.userId, status: "active" }).lean(),
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
      emailSubject: r.emailSubject || "",
      emailFrom: r.emailFrom || "",
      emailAccount: r.emailAccount || "",
      ocrConfidence: r.ocrConfidence || 0,
      fileIds: r.fileIds || [],
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    };
    receiptMap[obj._id] = obj;
    return obj;
  });

  // Get file info for receipts that have attachments
  const allFileIds = data.flatMap((d) => d.fileIds);
  const files = allFileIds.length > 0
    ? await FileModel.find({ _id: { $in: allFileIds } }).select("name type size").lean()
    : [];
  const fileMap: Record<string, { name: string; type: string; size: number }> = {};
  for (const f of files as any[]) {
    fileMap[String(f._id)] = { name: f.name, type: f.type, size: f.size };
  }

  // Attach file info to receipts
  for (const d of data) {
    (d as any).files = d.fileIds.map((id: string) => fileMap[id]).filter(Boolean);
  }

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

  // Gmail settings + accounts
  const accountsData = (googleAccounts as any[]).map((a: any) => ({
    _id: String(a._id),
    email: a.email,
    lastScanAt: a.lastScanAt ? new Date(a.lastScanAt).toISOString() : null,
    autoScan: a.autoScan,
  }));

  const gmailSettings = {
    connected: accountsData.length > 0 || !!user?.googleEmail,
    email: accountsData[0]?.email || user?.googleEmail || null,
    lastGmailScan: accountsData[0]?.lastScanAt || (user?.lastGmailScan ? new Date(user.lastGmailScan).toISOString() : null),
    autoGmailScan: accountsData[0]?.autoScan || user?.autoGmailScan || false,
    accounts: accountsData,
  };

  return <MatchingClient receipts={data} matches={matchData} gmailSettings={gmailSettings} />;
}

export default function MatchingPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-40 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <MatchingData />
    </Suspense>
  );
}
