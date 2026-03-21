import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError, getPagination } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Employee from "@/models/Employee";
import { validateBody, ValidationSchema } from "@/lib/validate";

const employeeSchema: ValidationSchema = {
  employeeCode: { required: true, type: "string", maxLength: 50, sanitize: true },
  name: { required: true, type: "string", maxLength: 200, sanitize: true },
  baseSalary: { required: true, type: "number", min: 0, max: 9999999 },
  nickname: { type: "string", maxLength: 100, sanitize: true },
  position: { type: "string", maxLength: 200, sanitize: true },
  department: { type: "string", maxLength: 200, sanitize: true },
  employmentType: { type: "string", enum: ["full-time", "part-time", "contract", "freelance"] },
  bankName: { type: "string", maxLength: 100, sanitize: true },
  bankAccount: { type: "string", maxLength: 50, sanitize: true },
  taxId: { type: "string", maxLength: 20, sanitize: true },
};

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { page, limit, skip } = getPagination(request);
    const { searchParams } = new URL(request.url);

    const filter: Record<string, unknown> = session.orgId
      ? { $or: [{ orgId: session.orgId }, { userId: session.userId }] }
      : { userId: session.userId };

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

    // Schema validation + sanitization
    const validation = validateBody(body, employeeSchema);
    if (!validation.valid) {
      return apiError(validation.errors.join(", "), 400);
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

    // Check duplicate employeeCode for this user/org
    const dupQuery = session.orgId
      ? { orgId: session.orgId, employeeCode: body.employeeCode }
      : { userId: session.userId, employeeCode: body.employeeCode };
    const existing = await Employee.findOne(dupQuery);
    if (existing) {
      return apiError("รหัสพนักงานซ้ำ", 400);
    }

    const employee = await Employee.create({
      userId: session.userId,
      orgId: session.orgId || undefined,
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
