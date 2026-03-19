import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";
import Payroll from "@/models/Payroll";
import PayrollClient from "./PayrollClient";

async function PayrollData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  const query = session.orgId ? { orgId: session.orgId } : { userId: session.userId };

  const employees = await Employee.find({ ...query, status: "active" }).lean();
  const payrolls = await Payroll.find({ ...query, month, year }).lean();

  const totalPayroll = payrolls.reduce((s: number, p: any) => s + (p.netPay || 0), 0);
  const totalEmployees = employees.length;
  const totalPaid = payrolls.filter((p: any) => p.status === "paid").length;
  const totalPending = payrolls.filter((p: any) => p.status === "draft" || p.status === "pending").length;

  // Serialize for client
  const serializedEmployees = employees.map((e: any) => ({
    _id: e._id.toString(),
    employeeCode: e.employeeCode,
    name: e.name,
    nickname: e.nickname || "",
    position: e.position || "",
    department: e.department || "",
    employmentType: e.employmentType || "full-time",
    startDate: e.startDate?.toISOString() || "",
    baseSalary: e.baseSalary || 0,
    allowances: e.allowances || [],
    socialSecurity: e.socialSecurity ?? true,
    providentFund: e.providentFund || 0,
    bankName: e.bankName || "",
    bankAccount: e.bankAccount || "",
    taxId: e.taxId || "",
    status: e.status,
  }));

  const serializedPayrolls = payrolls.map((p: any) => ({
    _id: p._id.toString(),
    employeeId: p.employeeId?.toString() || "",
    employeeCode: p.employeeCode,
    employeeName: p.employeeName,
    department: p.department || "",
    position: p.position || "",
    baseSalary: p.baseSalary || 0,
    overtime: p.overtime || { hours: 0, ratePerHour: 0, amount: 0 },
    allowances: p.allowances || [],
    bonus: p.bonus || 0,
    grossPay: p.grossPay || 0,
    socialSecurity: p.socialSecurity || 0,
    providentFund: p.providentFund || 0,
    tax: p.tax || 0,
    otherDeductions: p.otherDeductions || [],
    totalDeductions: p.totalDeductions || 0,
    netPay: p.netPay || 0,
    status: p.status,
    month: p.month,
    year: p.year,
    bankName: p.bankName || "",
    bankAccount: p.bankAccount || "",
    note: p.note || "",
  }));

  return (
    <PayrollClient
      employees={serializedEmployees}
      payrolls={serializedPayrolls}
      stats={{ totalPayroll, totalEmployees, totalPaid, totalPending }}
      currentMonth={month}
      currentYear={year}
    />
  );
}

export default function PayrollPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div>
            <div className="h-7 w-40 rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-64 rounded-md mt-2 bg-white/[0.04]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-white/[0.04]" />
        </div>
      }
    >
      <PayrollData />
    </Suspense>
  );
}
