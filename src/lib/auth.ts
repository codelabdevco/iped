import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDB } from "./mongodb";
import User from "@/models/User";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production" && typeof window === "undefined" && process.env.NEXT_PHASE !== "phase-production-build") {
  console.error("WARNING: JWT_SECRET not set in production!");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "iped-secret-key-change-in-production");
const TOKEN_NAME = "iped-token";
const TOKEN_EXPIRY = "7d";

export interface JWTPayload {
  userId: string;
  role: string;
  accountType: string;
  orgId?: string;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.userId).lean();
  return user;
}

export function setTokenCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    "Set-Cookie": `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`,
  };
}

export function clearTokenCookie() {
  return {
    "Set-Cookie": `${TOKEN_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  };
}

// LINE Login helpers
export function getLineLoginUrl(state: string): string {
  const clientId = process.env.LINE_LOGIN_CHANNEL_ID || process.env.LINE_CHANNEL_ID || "";
  const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line/callback`);
  return `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid%20email`;
}

export async function exchangeLineCode(code: string) {
  const res = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line/callback`,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID || process.env.LINE_CHANNEL_ID || "",
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET || process.env.LINE_CHANNEL_SECRET || "",
    }),
  });
  return res.json();
}

export async function getLineProfile(accessToken: string) {
  const res = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

// Role-based access checks
export function canManageOrg(role: string): boolean {
  return ["superadmin", "admin", "manager"].includes(role);
}

export function canApprove(role: string): boolean {
  return ["superadmin", "admin", "manager", "accountant"].includes(role);
}

export function canViewAdmin(role: string): boolean {
  return ["superadmin", "admin"].includes(role);
}

export function isSuperAdmin(role: string): boolean {
  return role === "superadmin";
}
