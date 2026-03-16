import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) redirect("/login");
  const payload = await verifyToken(token);
  if (!payload) redirect("/login");
  return <DashboardShell displayName={payload.userId as string}>{children}</DashboardShell>;
}
