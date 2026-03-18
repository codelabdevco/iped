import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import ReceiptsClient from "./ReceiptsClient";

interface JwtPayload {
  userId: string;
}

export default async function ReceiptsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) redirect("/login");

  await connectDB();
  const receipts = await Receipt.find({ userId: decoded.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

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
    ocrConfidence: r.ocrConfidence ?? null,
    imageUrl: r.imageUrl || "",
    driveUploaded: !!r.imageUrl,
    items: Array.isArray(r.items) ? r.items : [],
    itemCount: Array.isArray(r.items) ? r.items.length : 0,
  }));

  return <ReceiptsClient receipts={data} />;
}
