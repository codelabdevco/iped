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

  const user = await verifyToken(token);
  if (!user) redirect("/login");

  await connectDB();
  const receipts = await Receipt.find({ userId: decoded.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const data = receipts.map((r) => ({
    _id: String(r._id),
    storeName: r.storeName || "ไม่ระบุร้าน",
    amount: r.amount || 0,
    category: r.category || "ไม่ระบุ",
    date: r.date
      ? new Date(r.date).toLocaleDateString("th-TH")
      : new Date(r.createdAt).toLocaleDateString("th-TH"),
    status: r.status || "pending",
    type: r.type || "receipt",
    source: r.source || "line",
  }));

  return <ReceiptsClient receipts={data} />;
}
