import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getAccountMode } from "@/lib/mode";
import Receipt from "@/models/Receipt";
import FileModel from "@/models/File";
import DriveClient from "./DriveClient";

async function DriveData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const accountType = await getAccountMode();

  const [receipts, files] = await Promise.all([
    Receipt.find({ userId: session.userId, accountType })
      .select("merchant category date time status source direction imageHash paymentMethod amount createdAt")
      .sort({ createdAt: -1 }).limit(200).lean(),
    FileModel.find({ userId: session.userId })
      .select("-data")
      .sort({ createdAt: -1 }).limit(200).lean(),
  ]);

  const receiptDocs = receipts.map((r: any) => ({
    _id: String(r._id),
    name: r.merchant || "ไม่ระบุ",
    fileType: "receipt" as const,
    mimeType: "image/jpeg",
    category: r.category || "ไม่ระบุ",
    amount: r.amount || 0,
    date: r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }) : "",
    time: r.time || "",
    status: r.status || "pending",
    source: r.source || "web",
    direction: r.direction || "expense",
    hasImage: !!r.imageHash,
    size: 0,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
  }));

  const fileDocs = files.map((f: any) => ({
    _id: String(f._id),
    name: f.name,
    fileType: "file" as const,
    mimeType: f.type || "",
    category: f.category || "",
    amount: 0,
    date: f.createdAt ? new Date(f.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }) : "",
    time: "",
    status: "confirmed",
    source: "web",
    direction: "",
    hasImage: (f.type || "").startsWith("image/"),
    size: f.size || 0,
    createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : "",
  }));

  // Total storage used
  const totalFileSize = files.reduce((s: number, f: any) => s + (f.size || 0), 0);

  // Merge and sort by date
  const all = [...receiptDocs, ...fileDocs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return <DriveClient docs={all} totalStorageBytes={totalFileSize} />;
}

export default function DrivePage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-40 rounded-lg bg-white/[0.06]" /><div className="grid grid-cols-4 gap-3">{[0,1,2,3].map(i=><div key={i} className="h-40 rounded-xl bg-white/[0.04]" />)}</div></div>}>
      <DriveData />
    </Suspense>
  );
}
