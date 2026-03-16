import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SettingsClient from "./SettingsClient";

interface JwtPayload {
  userId: string;
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) redirect("/login");

  await connectDB();
  const user = await User.findById(decoded.userId).lean();
  if (!user) return null;

  const profile = {
    displayName: user.displayName || "",
    pictureUrl: user.pictureUrl || "",
    birthDate: user.birthDate || "",
    gender: user.gender || "",
    occupation: user.occupation || "",
    accountType: user.accountType || "personal",
  };

  return <SettingsClient profile={profile} />;
}
