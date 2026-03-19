export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getAccountMode } from "@/lib/mode";
import { getUserPlan } from "@/lib/quota";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import Payroll from "@/models/Payroll";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) redirect("/login");
  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  await connectDB();
  const accountType = await getAccountMode();
  const userId = payload.userId;

  const [user, pendingReceipts, pendingApprovals, pendingReimbursement, pendingPayroll, pendingClaims] = await Promise.all([
    User.findById(userId).select("lineDisplayName lineProfilePic name orgId").lean(),
    Receipt.countDocuments({ userId, accountType, status: "pending" }),
    // Business: approvals — confirmed items waiting to be paid
    accountType === "business"
      ? Receipt.countDocuments({ userId, accountType: "business", status: "confirmed" })
      : Promise.resolve(0),
    // Business: reimbursement — paid items (processed from approvals)
    accountType === "business"
      ? Receipt.countDocuments({ userId, accountType: "business", status: "paid", note: /ค่าใช้จ่ายบริษัท จากส่วนตัว/ })
      : Promise.resolve(0),
    // Business: payroll pending
    accountType === "business"
      ? Payroll.countDocuments({ userId, status: { $in: ["draft", "pending"] } })
      : Promise.resolve(0),
    // Personal: claims pending
    accountType === "personal"
      ? Receipt.countDocuments({ userId, accountType: "personal", note: /ส่งเป็นค่าใช้จ่ายบริษัทแล้ว/ })
      : Promise.resolve(0),
  ]);

  const userPlan = await getUserPlan(payload.userId);

  const displayName = user?.lineDisplayName || user?.name || "User";
  const pictureUrl = user?.lineProfilePic || "";
  const hasOrg = !!(user as any)?.orgId;

  const badges: Record<string, number> = {};
  if (pendingReceipts > 0) badges["/dashboard/receipts"] = pendingReceipts;
  if (hasOrg && pendingApprovals > 0) badges["/dashboard/approvals"] = pendingApprovals;
  if (hasOrg && pendingReimbursement > 0) badges["/dashboard/reimbursement"] = pendingReimbursement;
  if (hasOrg && pendingPayroll > 0) badges["/dashboard/payroll"] = pendingPayroll;
  if (hasOrg && pendingClaims > 0) badges["/dashboard/my-claims"] = pendingClaims;

  return (
    <DashboardShell displayName={displayName} pictureUrl={pictureUrl} pendingReceipts={pendingReceipts} badges={badges} hasOrg={hasOrg} planUsage={JSON.parse(JSON.stringify(userPlan))}>
      {children}
    </DashboardShell>
  );
}
