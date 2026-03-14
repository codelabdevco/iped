import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload, canManageOrg } from "@/lib/auth";
import Organization from "@/models/Organization";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();

    if (session.orgId) {
      const org = await Organization.findById(session.orgId).lean();
      return apiSuccess({ organization: org });
    }

    // If superadmin, list all orgs
    if (session.role === "superadmin") {
      const orgs = await Organization.find().sort({ createdAt: -1 }).limit(100).lean();
      return apiSuccess({ organizations: orgs });
    }

    return apiSuccess({ organization: null });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    if (!canManageOrg(session.role)) {
      return apiError("ไม่มีสิทธิ์สร้างองค์กร", 403);
    }

    await connectDB();
    const body = await req.json();

    const org = await Organization.create({
      ...body,
      createdBy: session.userId,
      members: [{ userId: session.userId, role: "admin", joinedAt: new Date() }],
    });

    return apiSuccess({ organization: org }, 201);
  });
}
