import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import AccountingClient from "./AccountingClient";

async function AccountingData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const logs = await AuditLog.find({
    $or: [
      { category: "system" },
      { action: { $regex: /sync/i } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const syncLogs = logs.map((log: any) => ({
    _id: String(log._id),
    time: new Date(log.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
    system: log.metadata?.system || log.action || "-",
    event: log.description || "-",
    status: log.level === "error" || log.level === "critical" ? "ผิดพลาด" : "สำเร็จ",
  }));

  return <AccountingClient syncLogs={syncLogs} />;
}

export default function AccountingPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-white/10" />
            ))}
          </div>
          <div className="h-48 rounded-xl bg-gray-200 dark:bg-white/10" />
        </div>
      }
    >
      <AccountingData />
    </Suspense>
  );
}
