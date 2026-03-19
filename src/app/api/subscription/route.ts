import { NextRequest } from "next/server";
import { withAuth, apiSuccess } from "@/lib/api-helpers";
import { getUserPlan } from "@/lib/quota";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const plan = await getUserPlan(session.userId);
    return apiSuccess({ ...plan });
  });
}
