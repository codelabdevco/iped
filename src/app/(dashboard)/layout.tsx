import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

interface JwtPayload {
  userId: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user: JwtPayload;
  try {
    user = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as JwtPayload;
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header displayName={user.displayName} pictureUrl={user.pictureUrl} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
