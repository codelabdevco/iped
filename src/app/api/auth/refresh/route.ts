import { NextRequest, NextResponse } from "next/server";
import { refreshTokenIfNeeded, setTokenCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) return NextResponse.json({ refreshed: false });

  const newToken = await refreshTokenIfNeeded(token);
  if (newToken) {
    const response = NextResponse.json({ refreshed: true });
    const cookie = setTokenCookie(newToken);
    response.headers.set("Set-Cookie", cookie["Set-Cookie"]);
    return response;
  }

  return NextResponse.json({ refreshed: false });
}
