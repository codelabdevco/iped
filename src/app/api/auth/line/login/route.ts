import { NextResponse } from "next/server";
import { getLineLoginUrl } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function GET() {
  const state = uuid();
  const url = getLineLoginUrl(state);
  return NextResponse.redirect(url);
}
