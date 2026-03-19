export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getAccountMode } from "@/lib/mode";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) redirect("/login");
  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  await connectDB();
  const accountType = await getAccountMode();

  const [user, pendingCount] = await Promise.all([
    User.findById(payload.userId)
      .select("lineDisplayName lineProfilePic name")
      .lean(),
    Receipt.countDocuments({ userId: payload.userId, accountType, status: "pending" }),
  ]);

  const displayName = user?.lineDisplayName || user?.name || "User";
  const pictureUrl = user?.lineProfilePic || "";

  return (
    <DashboardShell displayName={displayName} pictureUrl={pictureUrl} pendingReceipts={pendingCount}>
      {children}
    </DashboardShell>
  );
}
