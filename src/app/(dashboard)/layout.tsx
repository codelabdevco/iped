export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getAccountMode } from "@/lib/mode";
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
    User.findById(userId).select("lineDisplayName lineProfilePic name").lean(),
    Receipt.countDocuments({ userId, accountType, status: "pending" }),
    // Business: receipts waiting approval
    accountType === "business"
      ? Receipt.countDocuments({ userId, accountType: "business", status: { $in: ["pending", "confirmed"] } })
      : Promise.resolve(0),
    // Business: reimbursement pending
    accountType === "business"
      ? Receipt.countDocuments({ userId, accountType: "business", status: "pending", note: /ค่าใช้จ่ายบริษัท จากส่วนตัว/ })
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

  const displayName = user?.lineDisplayName || user?.name || "User";
  const pictureUrl = user?.lineProfilePic || "";

  const badges: Record<string, number> = {};
  if (pendingReceipts > 0) badges["/dashboard/receipts"] = pendingReceipts;
  if (pendingApprovals > 0) badges["/dashboard/approvals"] = pendingApprovals;
  if (pendingReimbursement > 0) badges["/dashboard/reimbursement"] = pendingReimbursement;
  if (pendingPayroll > 0) badges["/dashboard/payroll"] = pendingPayroll;
  if (pendingClaims > 0) badges["/dashboard/my-claims"] = pendingClaims;

  return (
    <DashboardShell displayName={displayName} pictureUrl={pictureUrl} pendingReceipts={pendingReceipts} badges={badges}>
      {children}
    </DashboardShell>
  );
}
