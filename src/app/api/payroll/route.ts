import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError, getPagination } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Payroll from "@/models/Payroll";
import Employee, { IEmployee } from "@/models/Employee";

function calculatePayroll(employee: IEmployee, overrides: Record<string, unknown> = {}) {
  const baseSalary = (overrides.baseSalary as number) ?? employee.baseSalary;
  const allowances = (overrides.allowances as { type: string; amount: number }[]) ?? employee.allowances ?? [];
  const overtime = (overrides.overtime as { hours: number; ratePerHour: number; amount: number }) ?? {
    hours: 0,
    ratePerHour: 0,
    amount: 0,
  };
  const bonus = (overrides.bonus as number) ?? 0;
  const tax = (overrides.tax as number) ?? 0;
  const otherDeductions = (overrides.otherDeductions as { type: string; amount: number }[]) ?? [];

  const allowancesTotal = allowances.reduce((sum: number, a: { amount: number }) => sum + (a.amount || 0), 0);
  const grossPay = baseSalary + allowancesTotal + (overtime.amount || 0) + bonus;

  const socialSecurity = employee.socialSecurity ? Math.min(baseSalary * 0.05, 750) : 0;
  const providentFund = employee.providentFund > 0 ? baseSalary * (employee.providentFund / 100) : 0;
  const otherDeductionsTotal = otherDeductions.reduce((sum: number, d: { amount: number }) => sum + (d.amount || 0), 0);
  const totalDeductions = socialSecurity + providentFund + tax + otherDeductionsTotal;
  const netPay = grossPay - totalDeductions;

  return {
    baseSalary,
    allowances,
    overtime,
    bonus,
    grossPay,
    socialSecurity,
    providentFund,
    tax,
    otherDeductions,
    totalDeductions,
    netPay,
  };
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { page, limit, skip } = getPagination(request);
    const { searchParams } = new URL(request.url);

    const filter: Record<string, unknown> = { userId: session.userId };

    const month = searchParams.get("month");
    if (month) filter.month = parseInt(month);

    const year = searchParams.get("year");
    if (year) filter.year = parseInt(year);

    const status = searchParams.get("status");
    if (status) filter.status = status;

    const employeeId = searchParams.get("employeeId");
    if (employeeId) filter.employeeId = employeeId;

    const [payrolls, total, summary] = await Promise.all([
      Payroll.find(filter).sort({ year: -1, month: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payroll.countDocuments(filter),
      Payroll.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalGross: { $sum: "$grossPay" },
            totalNet: { $sum: "$netPay" },
            totalTax: { $sum: "$tax" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = summary[0] || { totalGross: 0, totalNet: 0, totalTax: 0, count: 0 };

    return apiSuccess({
      payrolls: payrolls.map((p) => ({ ...p, _id: String(p._id), employeeId: String(p.employeeId) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        totalGross: stats.totalGross,
        totalNet: stats.totalNet,
        totalTax: stats.totalTax,
        count: stats.count,
      },
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    if (!body.month || !body.year) {
      return apiError("กรุณาระบุ month และ year", 400);
    }

    // Individual payroll creation
    if (body.employeeId) {
      const employee = await Employee.findOne({
        _id: body.employeeId,
        userId: session.userId,
      });
      if (!employee) {
        return apiError("ไม่พบข้อมูลพนักงาน", 404);
      }

      // Check duplicate
      const existing = await Payroll.findOne({
        employeeId: body.employeeId,
        month: body.month,
        year: body.year,
        userId: session.userId,
        status: { $ne: "cancelled" },
      });
      if (existing) {
        return apiError("มีข้อมูลเงินเดือนของพนักงานคนนี้ในเดือนนี้แล้ว", 400);
      }

      const calc = calculatePayroll(employee, body);

      const payroll = await Payroll.create({
        employeeId: employee._id,
        orgId: session.userId,
        userId: session.userId,
        month: body.month,
        year: body.year,
        employeeName: employee.name,
        employeeCode: employee.employeeCode,
        department: employee.department,
        position: employee.position,
        bankName: employee.bankName,
        bankAccount: employee.bankAccount,
        ...calc,
        note: body.note,
      });

      return apiSuccess(
        { payroll: { ...payroll.toObject(), _id: String(payroll._id), employeeId: String(payroll.employeeId) } },
        201
      );
    }

    // Batch: generate for all active employees
    const employees = await Employee.find({
      userId: session.userId,
      status: "active",
    });

    if (employees.length === 0) {
      return apiError("ไม่พบพนักงานที่มีสถานะ active", 400);
    }

    let created = 0;
    let skipped = 0;

    for (const employee of employees) {
      const existing = await Payroll.findOne({
        employeeId: employee._id,
        month: body.month,
        year: body.year,
        userId: session.userId,
        status: { $ne: "cancelled" },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const calc = calculatePayroll(employee, body);

      await Payroll.create({
        employeeId: employee._id,
        orgId: session.userId,
        userId: session.userId,
        month: body.month,
        year: body.year,
        employeeName: employee.name,
        employeeCode: employee.employeeCode,
        department: employee.department,
        position: employee.position,
        bankName: employee.bankName,
        bankAccount: employee.bankAccount,
        ...calc,
        note: body.note,
      });
      created++;
    }

    return apiSuccess({ created, skipped, total: employees.length }, 201);
  });
}
