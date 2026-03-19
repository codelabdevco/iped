import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Payroll from "@/models/Payroll";
import Employee, { IEmployee } from "@/models/Employee";

function calculatePayroll(employee: IEmployee) {
  const baseSalary = employee.baseSalary;
  const allowances = employee.allowances || [];
  const allowancesTotal = allowances.reduce((sum: number, a: { amount: number }) => sum + (a.amount || 0), 0);
  const grossPay = baseSalary + allowancesTotal;

  const socialSecurity = employee.socialSecurity ? Math.min(baseSalary * 0.05, 750) : 0;
  const providentFund = employee.providentFund > 0 ? baseSalary * (employee.providentFund / 100) : 0;
  const totalDeductions = socialSecurity + providentFund;
  const netPay = grossPay - totalDeductions;

  return {
    baseSalary,
    allowances,
    overtime: { hours: 0, ratePerHour: 0, amount: 0 },
    bonus: 0,
    grossPay,
    socialSecurity,
    providentFund,
    tax: 0,
    otherDeductions: [],
    totalDeductions,
    netPay,
  };
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    if (!body.month || !body.year) {
      return apiError("กรุณาระบุ month และ year", 400);
    }

    const month = parseInt(body.month);
    const year = parseInt(body.year);

    if (month < 1 || month > 12) {
      return apiError("month ต้องอยู่ระหว่าง 1-12", 400);
    }

    const employees = await Employee.find({
      userId: session.userId,
      status: "active",
    });

    if (employees.length === 0) {
      return apiError("ไม่พบพนักงานที่มีสถานะ active", 400);
    }

    // Find existing payrolls for this period in one query
    const existingPayrolls = await Payroll.find({
      userId: session.userId,
      month,
      year,
      status: { $ne: "cancelled" },
    }).select("employeeId");

    const existingSet = new Set(existingPayrolls.map((p) => String(p.employeeId)));

    const toCreate = [];
    let skipped = 0;

    for (const employee of employees) {
      if (existingSet.has(String(employee._id))) {
        skipped++;
        continue;
      }

      const calc = calculatePayroll(employee);

      toCreate.push({
        employeeId: employee._id,
        orgId: session.userId,
        userId: session.userId,
        month,
        year,
        employeeName: employee.name,
        employeeCode: employee.employeeCode,
        department: employee.department,
        position: employee.position,
        bankName: employee.bankName,
        bankAccount: employee.bankAccount,
        ...calc,
      });
    }

    if (toCreate.length > 0) {
      await Payroll.insertMany(toCreate);
    }

    return apiSuccess({
      created: toCreate.length,
      skipped,
      total: employees.length,
    }, 201);
  });
}
