import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import DriveClient from "./DriveClient";

async function DriveData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const receipts = await Receipt.find({ userId: session.userId })
    .select("merchant category date time status source direction imageHash paymentMethod amount createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const docs = receipts.map((r: any) => ({
    _id: String(r._id),
    name: r.merchant || "ไม่ระบุ",
    category: r.category || "ไม่ระบุ",
    amount: r.amount || 0,
    date: r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }) : "",
    rawDate: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
    time: r.time || "",
    status: r.status || "pending",
    source: r.source || "web",
    direction: r.direction || "expense",
    hasImage: !!r.imageHash,
    paymentMethod: r.paymentMethod || "",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
  }));

  return <DriveClient docs={docs} />;
}

export default function DrivePage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-40 rounded-lg bg-white/[0.06]" /><div className="grid grid-cols-4 gap-3">{[0,1,2,3].map(i=><div key={i} className="h-40 rounded-xl bg-white/[0.04]" />)}</div></div>}>
      <DriveData />
    </Suspense>
  );
}
