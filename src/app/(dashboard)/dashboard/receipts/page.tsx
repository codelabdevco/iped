import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import User from "@/models/User";
import ReceiptsClient from "./ReceiptsClient";

export default async function ReceiptsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  await connectDB();

  // For business mode: fetch all user names in the org for mapping
  const [receipts, currentUser] = await Promise.all([
    Receipt.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    User.findById(decoded.userId).select("lineDisplayName name accountType orgId").lean(),
  ]);

  // Build userId → display name map (for business mode with team)
  let userNameMap: Record<string, string> = {};
  if (currentUser) {
    userNameMap[decoded.userId] = (currentUser as any).lineDisplayName || (currentUser as any).name || "ฉัน";

    // If business mode with orgId, fetch team members
    if ((currentUser as any).orgId) {
      const teamUsers = await User.find({ orgId: (currentUser as any).orgId })
        .select("_id lineDisplayName name")
        .lean();
      teamUsers.forEach((u: any) => {
        userNameMap[String(u._id)] = u.lineDisplayName || u.name || "ไม่ระบุ";
      });
    }
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
    imageUrl: r.imageUrl || "",
    driveUploaded: !!r.imageUrl,
    items: Array.isArray(r.items) ? r.items : (Array.isArray(r.lineItems) ? r.lineItems.map((li: any) => ({ name: li.description, qty: li.quantity, price: li.unitPrice })) : []),
    itemCount: Array.isArray(r.items) ? r.items.length : (Array.isArray(r.lineItems) ? r.lineItems.length : 0),
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    submittedBy: userNameMap[r.userId] || "",
  }));

  return <ReceiptsClient receipts={data} />;
}
