import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Employee from "@/models/Employee";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { id } = await params;

    const employee = await Employee.findOne({
      _id: id,
      userId: session.userId,
    }).lean();

    if (!employee) {
      return apiError("ไม่พบข้อมูลพนักงาน", 404);
    }

    return apiSuccess({ employee: { ...employee, _id: String(employee._id) } });
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

    const employee = await Employee.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!employee) {
      return apiError("ไม่พบข้อมูลพนักงาน", 404);
    }

    return apiSuccess({ employee: { ...employee, _id: String(employee._id) } });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { id } = await params;

    const employee = await Employee.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: { status: "terminated" } },
      { new: true }
    ).lean();

    if (!employee) {
      return apiError("ไม่พบข้อมูลพนักงาน", 404);
    }

    return apiSuccess({ employee: { ...employee, _id: String(employee._id) } });
  });
}
