"use client";
import { useTheme } from "@/contexts/ThemeContext";
import { TrendingUp, TrendingDown, Hash } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface RecurringEntry {
  id: string;
  name: string;
  type: string;
  amount: number;
  cycle: string;
  next: string;
  active: boolean;
}

interface RecurringClientProps {
  data: RecurringEntry[];
  incomeTotal: number;
  expenseTotal: number;
  activeCount: number;
}

export default function RecurringClient({ data, incomeTotal, expenseTotal, activeCount }: RecurringClientProps) {
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
      <PageHeader title="รายการประจำ" description="รายรับ-รายจ่ายที่เกิดขึ้นเป็นประจำ" actionLabel="เพิ่มรายการ" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="รายรับประจำ" value={`฿${incomeTotal.toLocaleString()}`} icon={<TrendingUp size={20} />} color="text-green-500" />
        <StatsCard label="รายจ่ายประจำ" value={`฿${expenseTotal.toLocaleString()}`} icon={<TrendingDown size={20} />} color="text-red-500" />
        <StatsCard label="รายการที่ใช้งาน" value={`${activeCount} รายการ`} icon={<Hash size={20} />} color="text-blue-500" />
      </div>
      <DataTable columns={columns} data={data} rowKey={(r) => r.id} />
    </div>
  );
}
