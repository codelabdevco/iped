import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Payroll from "@/models/Payroll";
import Employee from "@/models/Employee";
import { sendPayrollNotification } from "@/lib/payroll-notify";

function recalculateTotals(payroll: Record<string, unknown>) {
  const baseSalary = (payroll.baseSalary as number) || 0;
  const allowances = (payroll.allowances as { type: string; amount: number }[]) || [];
  const overtime = (payroll.overtime as { hours: number; ratePerHour: number; amount: number }) || {
    hours: 0,
    ratePerHour: 0,
    amount: 0,
  };
  const bonus = (payroll.bonus as number) || 0;
  const socialSecurity = (payroll.socialSecurity as number) || 0;
  const providentFund = (payroll.providentFund as number) || 0;
  const tax = (payroll.tax as number) || 0;
  const otherDeductions = (payroll.otherDeductions as { type: string; amount: number }[]) || [];

  const allowancesTotal = allowances.reduce((sum: number, a: { amount: number }) => sum + (a.amount || 0), 0);
  const grossPay = baseSalary + allowancesTotal + (overtime.amount || 0) + bonus;
  const otherDeductionsTotal = otherDeductions.reduce((sum: number, d: { amount: number }) => sum + (d.amount || 0), 0);
  const totalDeductions = socialSecurity + providentFund + tax + otherDeductionsTotal;
  const netPay = grossPay - totalDeductions;

  return { grossPay, totalDeductions, netPay };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { id } = await params;

    const payroll = await Payroll.findOne({
      _id: id,
      userId: session.userId,
    }).lean();

    if (!payroll) {
      return apiError("ไม่พบข้อมูลเงินเดือน", 404);
    }

    return apiSuccess({
      payroll: { ...payroll, _id: String(payroll._id), employeeId: String(payroll.employeeId) },
    });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const existing = await Payroll.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!existing) {
      return apiError("ไม่พบข้อมูลเงินเดือน", 404);
    }

    // Only allow editing draft payrolls (unless changing status)
    if (existing.status !== "draft" && !body.status) {
      return apiError("ไม่สามารถแก้ไขข้อมูลเงินเดือนที่ไม่ใช่สถานะ draft", 400);
    }

    // Handle status transitions
    if (body.status === "approved") {
      body.approvedBy = session.userId;
      body.approvedAt = new Date();
    } else if (body.status === "paid") {
      body.paidAt = new Date();
    }

    // Merge updates and recalculate
    const merged = { ...existing.toObject(), ...body };
    const totals = recalculateTotals(merged);

    const payroll = await Payroll.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: { ...body, ...totals } },
      { new: true, runValidators: true }
    ).lean();

    // Send notifications on status change
    if (body.status === "approved" || body.status === "paid") {
      try {
        const employee = await Employee.findById(payroll!.employeeId).select("lineUserId email").lean() as any;
        if (employee?.lineUserId || employee?.email) {
          const p = payroll as any;
          sendPayrollNotification(
            {
              employeeName: p.employeeName,
              employeeCode: p.employeeCode,
              department: p.department || "",
              position: p.position || "",
              month: p.month,
              year: p.year,
              baseSalary: p.baseSalary,
              overtime: p.overtime || { hours: 0, amount: 0 },
              allowances: p.allowances || [],
              bonus: p.bonus || 0,
              grossPay: p.grossPay,
              socialSecurity: p.socialSecurity || 0,
              providentFund: p.providentFund || 0,
              tax: p.tax || 0,
              otherDeductions: p.otherDeductions || [],
              totalDeductions: p.totalDeductions,
              netPay: p.netPay,
              bankName: p.bankName || "",
              bankAccount: p.bankAccount || "",
              bankTransferRef: p.bankTransferRef,
              paidAt: p.paidAt,
            },
            body.status as "approved" | "paid",
            { lineUserId: employee.lineUserId, email: employee.email }
          ).catch((err) => console.error("Payroll notification failed:", err));
        }
      } catch (notifErr) {
        console.error("Payroll notification lookup error:", notifErr);
      }
    }

    return apiSuccess({
      payroll: { ...payroll, _id: String(payroll!._id), employeeId: String(payroll!.employeeId) },
    });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { id } = await params;

    const existing = await Payroll.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!existing) {
      return apiError("ไม่พบข้อมูลเงินเดือน", 404);
    }

    if (!["draft", "pending"].includes(existing.status)) {
      return apiError("ไม่สามารถยกเลิกเงินเดือนที่อนุมัติหรือจ่ายแล้ว", 400);
    }

    const payroll = await Payroll.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: { status: "cancelled" } },
      { new: true }
    ).lean();

    return apiSuccess({
      payroll: { ...payroll, _id: String(payroll!._id), employeeId: String(payroll!.employeeId) },
    });
  });
}
