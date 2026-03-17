"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, Receipt, Plus, Clock } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface InvoiceEntry {
  id: string; customer: string; item: string; amount: number; issued: string; due: string; status: string;
}

const initData: InvoiceEntry[] = [
  { id: "INV-2026-001", customer: "บจก. สยามเทค โซลูชั่นส์", item: "ระบบ ERP License x10", amount: 450000, issued: "2026-02-01", due: "2026-03-03", status: "ชำระแล้ว" },
  { id: "INV-2026-002", customer: "บจก. กรุงเทพ อินโนเวชั่น", item: "บริการติดตั้งเครือข่าย", amount: 185000, issued: "2026-02-10", due: "2026-03-12", status: "ชำระแล้ว" },
  { id: "INV-2026-003", customer: "หจก. พัฒนาซอฟต์", item: "พัฒนาเว็บแอป Phase 1", amount: 160000, issued: "2026-02-15", due: "2026-03-17", status: "ค้างชำระ" },
  { id: "INV-2026-004", customer: "บจก. ไทยดิจิทัล มีเดีย", item: "ออกแบบ UI/UX", amount: 95000, issued: "2026-01-20", due: "2026-02-19", status: "เกินกำหนด" },
  { id: "INV-2026-005", customer: "บจก. อีสเทิร์น โลจิสติกส์", item: "ระบบจัดการคลังสินค้า", amount: 520000, issued: "2026-03-01", due: "2026-03-31", status: "ค้างชำระ" },
  { id: "INV-2026-006", customer: "บจก. นอร์ทสตาร์ เอ็นจิเนียริ่ง", item: "ระบบ IoT Monitoring", amount: 275000, issued: "2026-01-10", due: "2026-02-09", status: "เกินกำหนด" },
  { id: "INV-2026-007", customer: "บจก. เซาท์เทิร์น ฟาร์ม", item: "ระบบ Smart Farm", amount: 380000, issued: "2026-02-20", due: "2026-03-22", status: "ค้างชำระ" },
  { id: "INV-2026-008", customer: "บจก. เวสเทิร์น ฟู้ดส์", item: "ระบบ POS ร้านอาหาร", amount: 120000, issued: "2026-03-05", due: "2026-04-04", status: "ชำระแล้ว" },
];

const statusStyle: Record<string, string> = { "ชำระแล้ว": "bg-green-500/20 text-green-400", "ค้างชำระ": "bg-yellow-500/20 text-yellow-400", "เกินกำหนด": "bg-red-500/20 text-red-400" };

export default function Page() {
  const { isDark } = useTheme();
  const [data, setData] = useState(initData);
  const pending = data.filter(d => d.status === "ค้างชำระ").length;
  const overdue = data.filter(d => d.status === "เกินกำหนด").length;
  const total = data.reduce((s, d) => s + d.amount, 0);
  const c = (d: string, l: string) => isDark ? d : l;

  const columns: Column<InvoiceEntry>[] = [
    { key: "id", label: "เลขที่", render: (r, isDark) => <span className={`font-mono ${isDark ? "text-white" : "text-gray-900"}`}>{r.id}</span> },
    { key: "customer", label: "ลูกค้า", render: (r, isDark) => <span className={isDark ? "text-white" : "text-gray-900"}>{r.customer}</span> },
    { key: "item", label: "รายการ" },
    { key: "amount", label: "จำนวนเงิน", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>฿{r.amount.toLocaleString()}</span> },
    { key: "issued", label: "ออก" },
    { key: "due", label: "ครบกำหนด" },
    { key: "status", label: "สถานะ", render: (r) => <span className={`px-2 py-1 rounded-full text-xs ${statusStyle[r.status]}`}>{r.status}</span> },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="ใบแจ้งหนี้ขาออก" description="จัดการใบแจ้งหนี้สำหรับลูกค้า" onClear={() => setData([])} actionLabel="สร้างใบแจ้งหนี้" />

      <div className="grid grid-cols-4 gap-4">
        {[["ทั้งหมด", data.length + " รายการ"], ["ค้างชำระ", pending + " รายการ"], ["เกินกำหนด", overdue + " รายการ"], ["มูลค่ารวม", "฿" + total.toLocaleString()]].map(([label, val]) => (
          <div key={label} className={`p-4 rounded-xl border ${c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
            <p className={`text-sm ${c("text-white/50", "text-gray-500")}`}>{label}</p>
            <p className={`text-xl font-bold mt-1 ${c("text-white", "text-gray-900")}`}>{val}</p>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={data} rowKey={(r) => r.id} />
    </div>
  );
}
