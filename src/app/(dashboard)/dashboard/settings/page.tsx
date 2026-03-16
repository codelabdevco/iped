import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
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

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback-secret"
  ) as JwtPayload;

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
