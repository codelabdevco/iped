import { NextResponse } from "next/server";
import { clearTokenCookie } from "@/lib/auth";

export async function POST() {
  const headers = clearTokenCookie();
  return NextResponse.json({ success: true }, { headers });
}
