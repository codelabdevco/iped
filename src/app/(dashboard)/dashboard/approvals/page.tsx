import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import Payroll from "@/models/Payroll";
import Employee from "@/models/Employee";
import ApprovalsClient from "./ApprovalsClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function ApprovalsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const userId = session.userId;

  // ── Expense approvals (receipts with pending/confirmed status) ──
  const receipts = await Receipt.find({
    userId,
    status: { $in: ["pending", "confirmed", "cancelled"] },
  })
    .select("merchant amount category date status source direction type createdAt imageHash")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const expenseApprovals = receipts.map((r: any) => ({
    _id: String(r._id),
    type: "expense" as const,
    name: r.merchant || "ไม่ระบุ",
    description: r.category || "",
    amount: r.amount || 0,
    date: r.date ? new Date(r.date).toISOString() : r.createdAt ? new Date(r.createdAt).toISOString() : "",
    status: r.status === "pending" ? "pending" : r.status === "confirmed" ? "approved" : "rejected",
    source: r.source || "web",
    hasImage: !!r.imageHash,
  }));

  // ── Payroll approvals ──
  const payrolls = await Payroll.find({
    userId,
    status: { $in: ["draft", "pending", "approved"] },
  })
    .select("employeeName employeeCode department month year netPay grossPay status createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const payrollApprovals = payrolls.map((p: any) => ({
    _id: String(p._id),
    type: "payroll" as const,
    name: p.employeeName || "ไม่ระบุ",
    description: `${p.employeeCode} • ${p.department || ""}`,
    amount: p.netPay || 0,
    date: p.createdAt ? new Date(p.createdAt).toISOString() : "",
    status: p.status === "draft" || p.status === "pending" ? "pending" : "approved",
    month: p.month,
    year: p.year,
  }));

  // ── Employee count ──
  const employeeCount = await Employee.countDocuments({ userId, status: "active" });

  return (
    <ApprovalsClient
      expenses={serialize(expenseApprovals)}
      payrolls={serialize(payrollApprovals)}
      employeeCount={employeeCount}
    />
  );
}

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <ApprovalsData />
    </Suspense>
  );
}
