import { redirect } from "next/navigation";

// ค่าใช้จ่ายบริษัท → redirect ไปหน้าใบเสร็จ/เอกสาร filter เฉพาะค่าใช้จ่ายบริษัท
export default function ReimbursementPage() {
  redirect("/dashboard/receipts?source=reimbursement");
}
