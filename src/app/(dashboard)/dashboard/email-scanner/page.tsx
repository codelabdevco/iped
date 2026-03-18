import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import User from "@/models/User";
import EmailScannerClient from "./EmailScannerClient";

async function EmailScannerData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  // Get user for Google connection status
  const user = await User.findById(session.userId)
    .select("googleEmail googleConnectedAt")
    .lean<{ googleEmail?: string; googleConnectedAt?: Date }>();

  // Query email-sourced documents
  const docs = await Document.find({ userId: session.userId, source: "email" })
    .select("emailSubject emailFrom date status ocrConfidence")
    .sort({ date: -1 })
    .limit(50)
    .lean();

  const totalScanned = docs.length;
  const totalWithOcr = docs.filter((d: any) => d.ocrConfidence && d.ocrConfidence > 0).length;

  const data = docs.map((d: any) => ({
    _id: String(d._id),
    emailSubject: d.emailSubject || "ไม่มีหัวข้อ",
    emailFrom: d.emailFrom || "ไม่ระบุ",
    date: d.date ? new Date(d.date).toLocaleDateString("th-TH") : "",
    status: d.status || "pending",
  }));

  return (
    <EmailScannerClient
      emails={data}
      googleEmail={user?.googleEmail || null}
      googleConnected={!!user?.googleConnectedAt}
      totalScanned={totalScanned}
      totalWithOcr={totalWithOcr}
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
