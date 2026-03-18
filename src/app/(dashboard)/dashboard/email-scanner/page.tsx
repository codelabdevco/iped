import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import User from "@/models/User";
import EmailScannerClient from "./EmailScannerClient";

async function EmailScannerData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const [user, docs] = await Promise.all([
    User.findById(session.userId)
      .select("googleEmail googleConnectedAt lastGmailScan autoGmailScan")
      .lean() as any,
    // Query from Receipt model (where Gmail scan actually saves data)
    Receipt.find({ userId: session.userId, source: "email" })
      .select("emailSubject emailFrom merchant amount date status ocrConfidence category note")
      .sort({ date: -1 })
      .limit(100)
      .lean(),
  ]);

  const totalScanned = docs.length;
  const totalWithOcr = docs.filter((d: any) => d.ocrConfidence && d.ocrConfidence > 0).length;

  const data = docs.map((d: any) => ({
    _id: String(d._id),
    emailSubject: d.emailSubject || d.note?.replace("จาก email: ", "") || d.merchant || "ไม่มีหัวข้อ",
    emailFrom: d.emailFrom || "",
    merchant: d.merchant || "",
    amount: d.amount || 0,
    category: d.category || "",
    date: d.date ? new Date(d.date).toLocaleDateString("th-TH") : "",
    rawDate: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
    status: d.status || "pending",
    ocrConfidence: d.ocrConfidence || 0,
  }));

  return (
    <EmailScannerClient
      emails={data}
      googleEmail={user?.googleEmail || null}
      googleConnected={!!user?.googleEmail}
      lastGmailScan={user?.lastGmailScan ? new Date(user.lastGmailScan).toISOString() : null}
      autoGmailScan={user?.autoGmailScan || false}
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
