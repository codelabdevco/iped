export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Debt from "@/models/Debt";
import DebtsClient from "./DebtsClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function DebtsData() {
  const session = await getSession();
  if (!session) redirect("/login");
  await connectDB();

  const query = session.orgId
    ? { $or: [{ orgId: session.orgId }, { userId: session.userId }] }
    : { userId: session.userId };

  const debts = await Debt.find(query).sort({ status: 1, dueDate: 1 }).lean();

  const data = debts.map((d: any) => ({
    _id: String(d._id),
    creditor: d.creditor,
    creditorType: d.creditorType || "bank",
    debtType: d.debtType || "term-loan",
    originalAmount: d.originalAmount || 0,
    remainingBalance: d.remainingBalance || 0,
    interestRate: d.interestRate || 0,
    interestType: d.interestType || "fixed",
    monthlyPayment: d.monthlyPayment || 0,
    startDate: d.startDate ? new Date(d.startDate).toISOString() : "",
    dueDate: d.dueDate ? new Date(d.dueDate).toISOString() : "",
    contractNumber: d.contractNumber || "",
    collateral: d.collateral || "",
    guarantor: d.guarantor || "",
    bankAccount: d.bankAccount || "",
    totalPaid: d.totalPaid || 0,
    totalInterestPaid: d.totalInterestPaid || 0,
    paymentsCount: d.payments?.length || 0,
    filesCount: d.files?.length || 0,
    payments: (d.payments || []).map((p: any) => ({
      _id: String(p._id),
      date: p.date ? new Date(p.date).toISOString() : "",
      amount: p.amount || 0,
      principal: p.principal || 0,
      interest: p.interest || 0,
      paymentType: p.paymentType || "installment",
      note: p.note || "",
      files: (p.files || []).map((f: any) => ({ _id: String(f._id), name: f.name, type: f.type, size: f.size, uploadedAt: f.uploadedAt ? new Date(f.uploadedAt).toISOString() : "" })),
    })),
    status: d.status || "active",
    note: d.note || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
  }));

  const stats = {
    totalDebt: data.reduce((s, d) => s + d.originalAmount, 0),
    totalRemaining: data.reduce((s, d) => s + d.remainingBalance, 0),
    totalPaid: data.reduce((s, d) => s + d.totalPaid, 0),
    active: data.filter(d => d.status === "active").length,
    paid: data.filter(d => d.status === "paid").length,
    overdue: data.filter(d => d.status === "overdue" || (d.status === "active" && new Date(d.dueDate) < new Date())).length,
  };

  return <DebtsClient debts={serialize(data)} stats={stats} />;
}

export default function DebtsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-48 rounded-lg bg-white/[0.06]" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />)}</div><div className="h-64 rounded-2xl bg-white/[0.04]" /></div>}>
      <DebtsData />
    </Suspense>
  );
}
