import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError, getPagination } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Employee from "@/models/Employee";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { page, limit, skip } = getPagination(request);
    const { searchParams } = new URL(request.url);

    const filter: Record<string, unknown> = { userId: session.userId };

    const status = searchParams.get("status");
    if (status) filter.status = status;

    const department = searchParams.get("department");
    if (department) filter.department = department;

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Employee.countDocuments(filter),
    ]);

    return apiSuccess({
      employees: employees.map((e) => ({ ...e, _id: String(e._id) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    if (!body.employeeCode || !body.name || body.baseSalary == null) {
      return apiError("กรุณากรอก employeeCode, name, baseSalary", 400);
    }

    // Check duplicate employeeCode for this user
    const existing = await Employee.findOne({
      userId: session.userId,
      employeeCode: body.employeeCode,
    });
    if (existing) {
      return apiError("รหัสพนักงานซ้ำ", 400);
    }

    const employee = await Employee.create({
      userId: session.userId,
      employeeCode: body.employeeCode,
      name: body.name,
      nickname: body.nickname,
      position: body.position || "",
      department: body.department || "",
      employmentType: body.employmentType || "full-time",
      startDate: body.startDate || new Date(),
      endDate: body.endDate,
      baseSalary: body.baseSalary,
      allowances: body.allowances || [],
      socialSecurity: body.socialSecurity ?? true,
      providentFund: body.providentFund || 0,
      bankName: body.bankName || "",
      bankAccount: body.bankAccount || "",
      taxId: body.taxId,
      status: body.status || "active",
    });

    return apiSuccess({ employee: { ...employee.toObject(), _id: String(employee._id) } }, 201);
  });
}
