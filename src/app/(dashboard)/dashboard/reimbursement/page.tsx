import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// ค่าใช้จ่ายบริษัท → redirect ไปหน้าใบเสร็จ/เอกสาร filter เฉพาะค่าใช้จ่ายบริษัท
export default async function ReimbursementPage() {
  const cookieStore = await cookies();
  const mode = cookieStore.get("iped-mode")?.value || "business";
  redirect(`/${mode}/dashboard/receipts?source=reimbursement`);
}
