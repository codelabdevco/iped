"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, ShieldCheck, Check, X, Clock } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

const initData = [
  { id: 1, requester: "นภา ศรีสุข", item: "ค่าเดินทางไปพบลูกค้า จ.ชลบุรี", amount: 4500, category: "ค่าเดินทาง", date: "2026-03-15", status: "รออนุมัติ" },
  { id: 2, requester: "ธนกร เจริญยิ่ง", item: "อุปกรณ์เซิร์ฟเวอร์ Dell PowerEdge", amount: 185000, category: "อุปกรณ์ IT", date: "2026-03-14", status: "รออนุมัติ" },
  { id: 3, requester: "กิตติพงษ์ อมรรัตน์", item: "ต่ออายุ License Microsoft 365", amount: 45000, category: "ซอฟต์แวร์", date: "2026-03-13", status: "อนุมัติ" },
  { id: 4, requester: "พิมพ์ชนก รัตนกุล", item: "เครื่องเขียนและอุปกรณ์สำนักงาน", amount: 3200, category: "สำนักงาน", date: "2026-03-12", status: "อนุมัติ" },
  { id: 5, requester: "วิชัย พงศ์ประเสริฐ", item: "ค่าจ้างผู้รับเหมาซ่อมแอร์", amount: 28000, category: "ซ่อมบำรุง", date: "2026-03-11", status: "ปฏิเสธ" },
  { id: 6, requester: "อรุณี มงคลชัย", item: "ค่าอบรมพนักงานใหม่", amount: 15000, category: "ฝึกอบรม", date: "2026-03-10", status: "อนุมัติ" },
  { id: 7, requester: "สุภาพร แสงทอง", item: "ค่าสอบบัญชีประจำปี", amount: 65000, category: "ค่าบริการ", date: "2026-03-16", status: "รออนุมัติ" },
  { id: 8, requester: "นภา ศรีสุข", item: "ค่าโฆษณา Facebook Ads", amount: 12000, category: "การตลาด", date: "2026-03-09", status: "ปฏิเสธ" },
];

const statusStyle: Record<string, string> = { "รออนุมัติ": "bg-yellow-500/20 text-yellow-400", "อนุมัติ": "bg-green-500/20 text-green-400", "ปฏิเสธ": "bg-red-500/20 text-red-400" };

export default function Page() {
  const { isDark } = useTheme();
  const [data, setData] = useState(initData);
  const pending = data.filter(d => d.status === "รออนุมัติ").length;
  const approved = data.filter(d => d.status === "อนุมัติ").length;
  const rejected = data.filter(d => d.status === "ปฏิเสธ").length;
  const c = (d: string, l: string) => isDark ? d : l;

  const handleAction = (id: number, action: string) => {
    setData(prev => prev.map(d => d.id === id ? { ...d, status: action } : d));
  };

  const columns: Column<typeof data[number]>[] = [
    { key: "requester", label: "ผู้ขอ" },
    { key: "item", label: "รายการ" },
    { key: "amount", label: "จำนวนเงิน", render: (r) => <span className="font-medium">฿{r.amount.toLocaleString()}</span> },
    { key: "category", label: "หมวดหมู่" },
    { key: "date", label: "วันที่ขอ" },
    { key: "status", label: "สถานะ", render: (r) => <span className={`px-2 py-1 rounded-full text-xs ${statusStyle[r.status]}`}>{r.status}</span> },
    { key: "actions", label: "จัดการ", render: (r) => r.status === "รออนุมัติ" ? (
      <div className="flex gap-1">
        <button onClick={() => handleAction(r.id, "อนุมัติ")} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleAction(r.id, "ปฏิเสธ")} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><X className="w-3.5 h-3.5" /></button>
      </div>
    ) : <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>-</span> },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="อนุมัติรายจ่าย" description="จัดการ workflow อนุมัติรายจ่าย" onClear={() => setData([])} />

      <div className="grid grid-cols-3 gap-4">
        {[["รออนุมัติ", pending + " รายการ"], ["อนุมัติแล้ว", approved + " รายการ"], ["ปฏิเสธ", rejected + " รายการ"]].map(([label, val]) => (
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
