"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { DollarSign, Clock, Users, AlertTriangle, Trash2, FileText } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface ARItem {
  id: string;
  customer: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  overdueDays: number;
  status: "ปกติ" | "เกินกำหนด" | "ค้างชำระ";
}

const initialData: ARItem[] = [
  { id: "1", customer: "บริษัท สยามเทค โซลูชั่นส์ จำกัด", invoiceNo: "INV-2026-0312", amount: 185000, dueDate: "2026-03-25", overdueDays: 0, status: "ปกติ" },
  { id: "2", customer: "ห้างหุ้นส่วนจำกัด กรุงไทยเทรดดิ้ง", invoiceNo: "INV-2026-0298", amount: 72500, dueDate: "2026-03-10", overdueDays: 7, status: "เกินกำหนด" },
  { id: "3", customer: "บริษัท พรีเมียร์ โลจิสติกส์ จำกัด", invoiceNo: "INV-2026-0275", amount: 340000, dueDate: "2026-02-15", overdueDays: 30, status: "เกินกำหนด" },
  { id: "4", customer: "บริษัท แกรนด์ รีเทล จำกัด (มหาชน)", invoiceNo: "INV-2026-0260", amount: 128000, dueDate: "2026-01-20", overdueDays: 56, status: "ค้างชำระ" },
  { id: "5", customer: "บริษัท อินโนเวท ดิจิทัล จำกัด", invoiceNo: "INV-2026-0245", amount: 95000, dueDate: "2025-12-18", overdueDays: 89, status: "ค้างชำระ" },
  { id: "6", customer: "บริษัท ธนบุรี ฟู้ดส์ จำกัด", invoiceNo: "INV-2026-0310", amount: 54000, dueDate: "2026-03-30", overdueDays: 0, status: "ปกติ" },
  { id: "7", customer: "บริษัท เอเชีย มาร์เก็ตติ้ง จำกัด", invoiceNo: "INV-2026-0288", amount: 210000, dueDate: "2026-02-28", overdueDays: 17, status: "เกินกำหนด" },
  { id: "8", customer: "บริษัท สมาร์ท เซอร์วิส จำกัด", invoiceNo: "INV-2026-0230", amount: 467000, dueDate: "2025-11-15", overdueDays: 122, status: "ค้างชำระ" },
];

export default function ReceivablesPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState<ARItem[]>(initialData);
  const clearDemo = () => setData([]);
  const totalOutstanding = data.reduce((sum, item) => sum + item.amount, 0);
  const overdueTotal = data.filter((item) => item.overdueDays > 0).reduce((sum, item) => sum + item.amount, 0);
  const uniqueCustomers = new Set(data.map((item) => item.customer)).size;
  const aging = {
    "0-30": data.filter((i) => i.overdueDays >= 0 && i.overdueDays <= 30).reduce((s, i) => s + i.amount, 0),
    "31-60": data.filter((i) => i.overdueDays >= 31 && i.overdueDays <= 60).reduce((s, i) => s + i.amount, 0),
    "61-90": data.filter((i) => i.overdueDays >= 61 && i.overdueDays <= 90).reduce((s, i) => s + i.amount, 0),
    "90+": data.filter((i) => i.overdueDays > 90).reduce((s, i) => s + i.amount, 0),
  };
  const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const statusColor = (status: ARItem["status"]) => {
    if (status === "ปกติ") return "text-emerald-500";
    if (status === "เกินกำหนด") return "text-amber-500";
    return "text-red-500";
  };
  const cardClass = `rounded-2xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;

  const columns: Column<ARItem>[] = [
    { key: "customer", label: "ลูกค้า" },
    { key: "invoiceNo", label: "เลขที่ใบแจ้งหนี้", render: (r) => <span className="font-mono text-xs">{r.invoiceNo}</span> },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <span className="font-medium">฿{fmt(r.amount)}</span> },
    { key: "dueDate", label: "ครบกำหนด" },
    { key: "overdueDays", label: "เกินกำหนด (วัน)", align: "right", render: (r) => <span className={r.overdueDays > 0 ? "font-semibold text-red-500" : ""}>{r.overdueDays > 0 ? r.overdueDays : "-"}</span> },
    { key: "status", label: "สถานะ", render: (r) => <span className={statusColor(r.status)}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="ยอดค้างชำระ" description="ติดตามยอดค้างชำระจากลูกค้า" onClear={clearDemo} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "ยอดค้างรวม", value: `฿${fmt(totalOutstanding)}`, icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "เกินกำหนด", value: `฿${fmt(overdueTotal)}`, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "จำนวนลูกค้า", value: String(uniqueCustomers), icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((card) => (
          <div key={card.label} className={cardClass}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}><card.icon size={20} className={card.color} /></div>
              <div>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{card.label}</p>
                <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={cardClass}>
        <h2 className={`mb-4 text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          <Clock size={18} className="mr-2 inline" />สรุปอายุหนี้
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "0-30 วัน", value: aging["0-30"], color: "bg-emerald-500" },
            { label: "31-60 วัน", value: aging["31-60"], color: "bg-amber-500" },
            { label: "61-90 วัน", value: aging["61-90"], color: "bg-orange-500" },
            { label: "90+ วัน", value: aging["90+"], color: "bg-red-500" },
          ].map((bucket) => (
            <div key={bucket.label} className={`rounded-xl border p-4 ${isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-2.5 w-2.5 rounded-full ${bucket.color}`} />
                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{bucket.label}</span>
              </div>
              <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>฿{fmt(bucket.value)}</p>
            </div>
          ))}
        </div>
      </div>
      <DataTable columns={columns} data={data} rowKey={(r) => r.id} />
    </div>
  );
}
