import { cookies } from "next/headers";

/**
 * Read the current account mode (personal/business) from the iped-mode cookie.
 * Used by server components to filter data by mode.
 */
export async function getAccountMode(): Promise<"personal" | "business"> {
  const cookieStore = await cookies();
  const mode = cookieStore.get("iped-mode")?.value;
  return mode === "business" ? "business" : "personal";
}
