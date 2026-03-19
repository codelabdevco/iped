export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { getAccountMode } from "@/lib/mode";
import Receipt from "@/models/Receipt";
import Match from "@/models/Match";
import User from "@/models/User";
import ReceiptsClient from "./ReceiptsClient";
import ReceiptsLoading from "./loading";

async function ReceiptsData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  await connectDB();
  const accountType = await getAccountMode();

  const [receipts, currentUser] = await Promise.all([
    Receipt.find({ userId: decoded.userId, accountType })
      .select("-imageUrl -ocrRawText")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    User.findById(decoded.userId).select("lineDisplayName name accountType orgId").lean(),
  ]);

  let userNameMap: Record<string, string> = {};
  if (currentUser) {
    userNameMap[decoded.userId] = (currentUser as any).lineDisplayName || (currentUser as any).name || "ฉัน";
    if ((currentUser as any).orgId) {
      const teamUsers = await User.find({ orgId: (currentUser as any).orgId })
        .select("_id lineDisplayName name")
        .lean();
      teamUsers.forEach((u: any) => {
        userNameMap[String(u._id)] = u.lineDisplayName || u.name || "ไม่ระบุ";
      });
    }
  }

  // Find matches for these receipts to show email link status
  const receiptIds = receipts.map((r: any) => String(r._id));
  const matches = await Match.find({
    userId: decoded.userId,
    status: "matched",
    $or: [
      { receiptA: { $in: receiptIds } },
      { receiptB: { $in: receiptIds } },
    ],
  }).lean();

  // Build map: receiptId → matched email receipt info
  const matchedEmailIds = new Set<string>();
  const matchMap: Record<string, string> = {}; // receiptId → matched email receiptId
  for (const m of matches as any[]) {
    matchMap[m.receiptA] = m.receiptB;
    matchMap[m.receiptB] = m.receiptA;
    matchedEmailIds.add(m.receiptA);
    matchedEmailIds.add(m.receiptB);
  }

  // Get email receipt names for matched ones
  const emailReceiptIds = [...matchedEmailIds].filter((id) => !receiptIds.includes(id));
  const emailReceipts = emailReceiptIds.length > 0
    ? await Receipt.find({ _id: { $in: emailReceiptIds } }).select("merchant emailSubject emailFrom").lean()
    : [];
  const emailMap: Record<string, { merchant: string; emailSubject: string }> = {};
  for (const e of emailReceipts as any[]) {
    emailMap[String(e._id)] = { merchant: e.merchant, emailSubject: e.emailSubject || "" };
  }

  const data = receipts.map((r: any) => ({
    _id: String(r._id),
    storeName: r.storeName || r.merchant || "ไม่ระบุร้าน",
    amount: r.amount || 0,
    category: r.category || "ไม่ระบุ",
    rawDate: r.date ? new Date(r.date).toISOString().slice(0,10) : new Date(r.createdAt).toISOString().slice(0,10),
    date: r.date
      ? new Date(r.date).toLocaleDateString("th-TH")
      : new Date(r.createdAt).toLocaleDateString("th-TH"),
    time: r.time || "",
    status: r.status || "pending",
    type: r.type || "receipt",
    source: r.source || "web",
    paymentMethod: r.paymentMethod || "",
    note: r.note || "",
    vat: r.vat || 0,
    wht: r.wht || 0,
    documentNumber: r.documentNumber || "",
    merchantTaxId: r.merchantTaxId || "",
    ocrConfidence: r.ocrConfidence != null ? (r.ocrConfidence > 1 ? r.ocrConfidence / 100 : r.ocrConfidence) : null,
    hasImage: !!r.imageHash,
    items: Array.isArray(r.items) ? r.items : (Array.isArray(r.lineItems) ? r.lineItems.map((li: any) => ({ name: li.description, qty: li.quantity, price: li.unitPrice })) : []),
    itemCount: Array.isArray(r.items) ? r.items.length : (Array.isArray(r.lineItems) ? r.lineItems.length : 0),
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    submittedBy: userNameMap[r.userId] || "",
    direction: r.direction || "expense",
    linkedEmail: (() => {
      const id = String(r._id);
      const matchedId = matchMap[id];
      if (!matchedId) return null;
      const email = emailMap[matchedId];
      return email ? { merchant: email.merchant, subject: email.emailSubject } : { merchant: "อีเมล", subject: "" };
    })(),
  }));

  return <ReceiptsClient receipts={data} />;
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={<ReceiptsLoading />}>
      <ReceiptsData />
    </Suspense>
  );
}
