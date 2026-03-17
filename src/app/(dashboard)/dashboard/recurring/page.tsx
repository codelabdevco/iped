"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Repeat, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface RecurringEntry {
  id: number; name: string; type: string; amount: number; cycle: string; next: string; active: boolean;
}

const INIT: RecurringEntry[] = [
  { id: 1, name: "เงินเดือน", type: "income", amount: 45000, cycle: "รายเดือน", next: "01/04/2569", active: true },
  { id: 2, name: "ค่าเช่าคอนโด", type: "expense", amount: 12000, cycle: "รายเดือน", next: "01/04/2569", active: true },
  { id: 3, name: "ค่าอินเทอร์เน็ต AIS Fibre", type: "expense", amount: 599, cycle: "รายเดือน", next: "15/04/2569", active: true },
  { id: 4, name: "Netflix Premium", type: "expense", amount: 419, cycle: "รายเดือน", next: "20/04/2569", active: true },
  { id: 5, name: "ประกันชีวิต AIA", type: "expense", amount: 18000, cycle: "รายปี", next: "15/08/2569", active: true },
  { id: 6, name: "ค่าโทรศัพท์ TRUE", type: "expense", amount: 799, cycle: "รายเดือน", next: "25/04/2569", active: false },
];

export default function RecurringPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);

  const columns: Column<RecurringEntry>[] = [
    { key: "name", label: "ชื่อรายการ", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.name}</span> },
    { key: "type", label: "ประเภท", render: (r) => <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${r.type === "income" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{r.type === "income" ? "รายรับ" : "รายจ่าย"}</span> },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <span className={`font-semibold ${r.type === "income" ? "text-green-500" : "text-red-500"}`}>{r.type === "income" ? "+" : "-"}฿{r.amount.toLocaleString()}</span> },
    { key: "cycle", label: "รอบ" },
    { key: "next", label: "วันถัดไป" },
    { key: "active", label: "สถานะ", render: (r) => <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${r.active ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>{r.active ? "ใช้งาน" : "หยุดชั่วคราว"}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="รายการประจำ" description="รายรับ-รายจ่ายที่เกิดขึ้นเป็นประจำ" onClear={() => setData([])} actionLabel="เพิ่มรายการ" />
      <DataTable columns={columns} data={data} rowKey={(r) => r.id} />
    </div>
  );
}
