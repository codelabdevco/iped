export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getAccountMode } from "@/lib/mode";
import Receipt from "@/models/Receipt";
import ApprovalsClient from "./ApprovalsClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function ApprovalsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const userId = session.userId;
  const accountType = await getAccountMode();

  // ดึงข้อมูลจาก receipts ของ mode ปัจจุบัน (business) เท่านั้น
  const receipts = await Receipt.find({ userId, accountType })
    .select("merchant amount category date status source direction type createdAt imageHash note")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const data = receipts
    .filter((r: any) => ["pending", "confirmed", "paid", "cancelled"].includes(r.status))
    .map((r: any) => {
      const isReimbursement = (r.note || "").includes("ค่าใช้จ่ายบริษัท จากส่วนตัว");
      let displayStatus: "pending" | "approved" | "paid" | "rejected" = "pending";
      if (r.status === "confirmed") displayStatus = "approved";
      else if (r.status === "paid") displayStatus = "paid";
      else if (r.status === "cancelled") displayStatus = "rejected";

      return {
        _id: String(r._id),
        name: r.merchant || "ไม่ระบุ",
        category: r.category || "",
        amount: r.amount || 0,
        date: r.createdAt ? new Date(r.createdAt).toISOString() : "",
        status: displayStatus,
        source: r.source || "web",
        hasImage: !!r.imageHash,
        isReimbursement,
        note: r.note || "",
      };
    });

  return <ApprovalsClient items={serialize(data)} />;
}

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <ApprovalsData />
    </Suspense>
  );
}
