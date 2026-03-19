export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import MyClaimsClient from "./MyClaimsClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function MyClaimsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  // Find personal receipts that were sent to business
  const receipts = await Receipt.find({
    userId: session.userId,
    accountType: "personal",
    note: /ส่งเป็นค่าใช้จ่ายบริษัทแล้ว/,
  })
    .select("merchant amount category date status note imageHash createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  // For each, find the business receipt to get its status
  const data = await Promise.all(receipts.map(async (r: any) => {
    const refMatch = (r.note || "").match(/ref:\s*([a-f0-9]+)/);
    let bizStatus = "pending";
    let bizNote = "";
    if (refMatch) {
      const bizReceipt = await Receipt.findById(refMatch[1]).select("status note paymentMethod companySlipImage companyNote").lean() as any;
      if (bizReceipt) {
        bizStatus = bizReceipt.status;
        bizNote = bizReceipt.note || "";
      }
      return {
        _id: String(r._id),
        merchant: r.merchant || "ไม่ระบุ",
        amount: r.amount || 0,
        category: r.category || "",
        date: r.createdAt ? new Date(r.createdAt).toISOString() : "",
        hasImage: !!r.imageHash,
        bizStatus,
        bizNote,
        companyNote: bizReceipt?.companyNote || "",
        hasCompanySlip: !!bizReceipt?.companySlipImage,
        bizReceiptId: refMatch ? refMatch[1] : "",
      };
    } else {
      return {
        _id: String(r._id),
        merchant: r.merchant || "ไม่ระบุ",
        amount: r.amount || 0,
        category: r.category || "",
        date: r.createdAt ? new Date(r.createdAt).toISOString() : "",
        hasImage: !!r.imageHash,
        bizStatus, bizNote,
        companyNote: "", hasCompanySlip: false, bizReceiptId: "",
      };
    }
  }));

  return <MyClaimsClient claims={serialize(data)} />;
}

export default function MyClaimsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-40 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <MyClaimsData />
    </Suspense>
  );
}
