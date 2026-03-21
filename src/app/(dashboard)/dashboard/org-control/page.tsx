export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getUserPlan } from "@/lib/quota";
import Organization from "@/models/Organization";
import Employee from "@/models/Employee";
import Receipt from "@/models/Receipt";
import Payroll from "@/models/Payroll";
import OrgControlClient from "./OrgControlClient";

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, v) =>
      typeof v === "object" && v?.constructor?.name === "ObjectId"
        ? String(v)
        : v
    )
  );
}

async function OrgControlData() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.orgId) redirect("/dashboard");

  await connectDB();

  const [org, employees, userPlan] = await Promise.all([
    Organization.findById(session.orgId).lean(),
    Employee.find({ userId: session.userId, status: "active" }).lean(),
    getUserPlan(session.userId, session.orgId),
  ]);

  if (!org) redirect("/dashboard");

  // Business receipts stats
  const bizReceipts = await Receipt.aggregate([
    { $match: { userId: session.userId, accountType: "business" } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        total: { $sum: "$amount" },
      },
    },
  ]);

  // Payroll this month
  const now = new Date();
  const payrollStats = await Payroll.aggregate([
    {
      $match: {
        userId: session.userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        total: { $sum: "$netPay" },
      },
    },
  ]);

  // Build receipt summary
  const receiptSummary: Record<string, { count: number; total: number }> = {};
  for (const r of bizReceipts) {
    receiptSummary[r._id] = { count: r.count, total: r.total };
  }

  // Build payroll summary
  const payrollSummary: Record<string, { count: number; total: number }> = {};
  for (const p of payrollStats) {
    payrollSummary[p._id] = { count: p.count, total: p.total };
  }

  return (
    <OrgControlClient
      org={serialize({
        name: org.name,
        taxId: (org as any).taxId || "",
        type: (org as any).type || "company",
        membersCount: (org as any).members?.length || 0,
        status: (org as any).status || "active",
      })}
      employees={serialize(
        employees.map((e: any) => ({
          _id: String(e._id),
          name: e.name,
          position: e.position,
          department: e.department,
          baseSalary: e.baseSalary,
          status: e.status,
          employeeCode: e.employeeCode,
        }))
      )}
      userPlan={serialize(userPlan)}
      receiptSummary={serialize(receiptSummary)}
      payrollSummary={serialize(payrollSummary)}
    />
  );
}

export default function OrgControlPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
          <div className="h-60 rounded-2xl bg-white/[0.04]" />
        </div>
      }
    >
      <OrgControlData />
    </Suspense>
  );
}
