import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import MobileShell from "@/components/mobile/MobileShell";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) redirect("/login");
  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  await connectDB();
  const user = await User.findById(payload.userId)
    .select("lineDisplayName lineProfilePic name")
    .lean() as any;

  return (
    <MobileShell
      displayName={user?.lineDisplayName || user?.name || "User"}
      pictureUrl={user?.lineProfilePic || ""}
    >
      {children}
    </MobileShell>
  );
}
