"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { DollarSign, Clock, Users, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Baht from "@/components/dashboard/Baht";

interface ARItem {
  _id: string;
  customer: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  overdueDays: number;
  status: "ปกติ" | "เกินกำหนด" | "ค้างชำระ";
}

interface ReceivablesClientProps {
  items: ARItem[];
}

export default function ReceivablesClient({ items }: ReceivablesClientProps) {
  const { isDark } = useTheme();

  const totalOutstanding = items.reduce((sum, item) => sum + item.amount, 0);
  const overdueTotal = items.filter((item) => item.overdueDays > 0).reduce((sum, item) => sum + item.amount, 0);
  const uniqueCustomers = new Set(items.map((item) => item.customer)).size;

  const aging = {
    "0-30": items.filter((i) => i.overdueDays >= 0 && i.overdueDays <= 30).reduce((s, i) => s + i.amount, 0),
    "31-60": items.filter((i) => i.overdueDays >= 31 && i.overdueDays <= 60).reduce((s, i) => s + i.amount, 0),
    "61-90": items.filter((i) => i.overdueDays >= 61 && i.overdueDays <= 90).reduce((s, i) => s + i.amount, 0),
    "90+": items.filter((i) => i.overdueDays > 90).reduce((s, i) => s + i.amount, 0),
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
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} direction="income" /> },
    { key: "dueDate", label: "ครบกำหนด" },
    { key: "overdueDays", label: "เกินกำหนด (วัน)", align: "right", render: (r) => <span className={r.overdueDays > 0 ? "font-semibold text-red-500" : ""}>{r.overdueDays > 0 ? r.overdueDays : "-"}</span> },
    { key: "status", label: "สถานะ", render: (r) => <span className={statusColor(r.status)}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="ยอดค้างชำระ" description="ติดตามยอดค้างชำระจากลูกค้า" />
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
      <DataTable columns={columns} data={items} rowKey={(r) => r._id} />
    </div>
  );
}
