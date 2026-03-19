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

    // Quota check — count active employees against package limit
    const { default: EmployeeModel } = await import("@/models/Employee");
    const { default: Subscription } = await import("@/models/Subscription");
    const { default: Package } = await import("@/models/Package");

    const employeeCount = await EmployeeModel.countDocuments({ userId: session.userId, status: "active" });
    const sub = await Subscription.findOne({ userId: session.userId, status: { $in: ["active", "trial"] } }).populate("packageId").lean() as any;
    const pkg = sub?.packageId || await Package.findOne({ tier: "free" }).lean() as any;
    const limit = pkg?.limits?.employees ?? 0;
    if (limit !== -1 && employeeCount >= limit) {
      return apiError(`เกินจำนวนพนักงานที่อนุญาต (${limit} คน) อัพเกรดแพ็กเกจเพื่อเพิ่ม`, 402);
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
