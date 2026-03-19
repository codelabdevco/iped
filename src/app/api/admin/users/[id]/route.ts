import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAdmin, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import File from "@/models/File";
import Match from "@/models/Match";
import Employee from "@/models/Employee";
import Payroll from "@/models/Payroll";

const VALID_ROLES = ["superadmin", "admin", "manager", "accountant", "user"];
const VALID_ACCOUNT_TYPES = ["personal", "business"];
const ADMIN_ROLES = ["superadmin", "admin"];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return withAdmin(request, async (_session: JWTPayload) => {
    await connectDB();
    const { id } = await context.params;

    const user = await User.findById(id)
      .select("-passwordHash -googleAccessToken -googleRefreshToken")
      .lean();

    if (!user) {
      return apiError("ไม่พบผู้ใช้", 404);
    }

    return apiSuccess({ user });
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return withAdmin(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const { id } = await context.params;
    const body = await req.json();

    const user = await User.findById(id);
    if (!user) {
      return apiError("ไม่พบผู้ใช้", 404);
    }

    const { name, email, role, accountType, status, occupation, phone } = body;

    if (role && !VALID_ROLES.includes(role)) {
      return apiError(
        `role ไม่ถูกต้อง ต้องเป็น: ${VALID_ROLES.join(", ")}`,
        400
      );
    }

    if (accountType && !VALID_ACCOUNT_TYPES.includes(accountType)) {
      return apiError(
        `accountType ไม่ถูกต้อง ต้องเป็น: ${VALID_ACCOUNT_TYPES.join(", ")}`,
        400
      );
    }

    // Prevent self-lockout: cannot change own role to non-admin
    if (
      id === session.userId &&
      role &&
      !ADMIN_ROLES.includes(role)
    ) {
      return apiError("ไม่สามารถเปลี่ยน role ของตัวเองเป็นที่ไม่ใช่ admin ได้", 400);
    }

    // Only update allowed fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (accountType !== undefined) updates.accountType = accountType;
    if (status !== undefined) updates.status = status;
    if (occupation !== undefined) updates.occupation = occupation;
    if (phone !== undefined) updates.phone = phone;

    const updated = await User.findByIdAndUpdate(id, updates, { new: true })
      .select("-passwordHash -googleAccessToken -googleRefreshToken")
      .lean();

    return apiSuccess({ user: updated });
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withAdmin(request, async (session: JWTPayload) => {
    await connectDB();
    const { id } = await context.params;

    if (id === session.userId) {
      return apiError("ไม่สามารถลบบัญชีตัวเองได้", 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return apiError("ไม่พบผู้ใช้", 404);
    }

    // Delete all user-related data
    await Promise.all([
      Receipt.deleteMany({ userId: id }),
      File.deleteMany({ userId: id }),
      Match.deleteMany({ userId: id }),
      Employee.deleteMany({ userId: id }),
      Payroll.deleteMany({ userId: id }),
      User.findByIdAndDelete(id),
    ]);

    return apiSuccess({ message: "ลบผู้ใช้และข้อมูลทั้งหมดเรียบร้อย" });
  });
}
