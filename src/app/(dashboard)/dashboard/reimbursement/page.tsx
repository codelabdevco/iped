import { redirect } from "next/navigation";

// เบิกจ่าย → redirect ไปหน้าใบเสร็จ/เอกสาร filter เฉพาะเบิกจ่าย
export default function ReimbursementPage() {
  redirect("/dashboard/receipts?source=reimbursement");
}
