import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import SecurityClient from "./SecurityClient";

async function SecurityData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const [logs, totalUsers, consentUsers] = await Promise.all([
    AuditLog.find()
      .populate("userId", "email name")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    User.countDocuments(),
    User.countDocuments({ "settings.pdpaConsent": true }),
  ]);

  // Get current user's PDPA settings
  const currentUser = await User.findById(session.userId)
    .select("settings.pdpaConsent settings.pdpaConsentDate settings.dataRetentionDays")
    .lean() as any;

  const consentPct = totalUsers > 0 ? ((consentUsers / totalUsers) * 100).toFixed(1) : "0";
  const retentionDays = currentUser?.settings?.dataRetentionDays ?? 365;
  const retentionMonths = Math.round(retentionDays / 30);

  const auditLogs = logs.map((log: any) => ({
    _id: String(log._id),
    time: log.createdAt ? new Date(log.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "",
    user: log.userId?.email || log.userId?.name || "ระบบ",
    action: log.description || log.action,
    ip: log.ipAddress || "-",
    status: log.level === "info" ? "สำเร็จ" : "ล้มเหลว" as "สำเร็จ" | "ล้มเหลว",
    createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : "",
  }));

  const pdpaStats = {
    consentPct: `${consentPct}%`,
    consentDesc: `ผู้ใช้ยินยอม ${consentUsers.toLocaleString()}/${totalUsers.toLocaleString()}`,
    retentionMonths: `${retentionMonths}M`,
    retentionDesc: `เก็บ ${retentionMonths} เดือน, ลบอัตโนมัติ`,
  };

  return <SecurityClient auditLogs={auditLogs} pdpaStats={pdpaStats} />;
}

export default function SecurityPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <SecurityData />
    </Suspense>
  );
}
