"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Check, X, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface ApprovalRow {
  _id: string;
  requester: string;
  item: string;
  amount: number;
  category: string;
  date: string;
  rawDate: string;
  status: string;
}

const statusStyle: Record<string, string> = {
  "รออนุมัติ": "bg-yellow-500/20 text-yellow-400",
  "อนุมัติ": "bg-green-500/20 text-green-400",
  "ปฏิเสธ": "bg-red-500/20 text-red-400",
};

export default function ApprovalsClient({ approvals: initial }: { approvals: ApprovalRow[] }) {
  const { isDark } = useTheme();
  const [data, setData] = useState(initial);
  const pending = data.filter(d => d.status === "รออนุมัติ").length;
  const approved = data.filter(d => d.status === "อนุมัติ").length;
  const rejected = data.filter(d => d.status === "ปฏิเสธ").length;
  const c = (d: string, l: string) => isDark ? d : l;

  const handleAction = (id: string, action: string) => {
    setData(prev => prev.map(d => d._id === id ? { ...d, status: action } : d));
  };

  const columns: Column<ApprovalRow>[] = [
    { key: "requester", label: "ผู้ขอ" },
    { key: "item", label: "รายการ" },
    { key: "amount", label: "จำนวนเงิน", render: (r) => <span className="font-medium">฿{r.amount.toLocaleString()}</span> },
    { key: "category", label: "หมวดหมู่" },
    { key: "date", label: "วันที่ขอ" },
    { key: "status", label: "สถานะ", render: (r) => <span className={`px-2 py-1 rounded-full text-xs ${statusStyle[r.status]}`}>{r.status}</span> },
    { key: "actions", label: "จัดการ", render: (r) => r.status === "รออนุมัติ" ? (
      <div className="flex gap-4">
        <button onClick={() => handleAction(r._id, "อนุมัติ")} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleAction(r._id, "ปฏิเสธ")} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><X className="w-3.5 h-3.5" /></button>
      </div>
    ) : <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>-</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="อนุมัติรายจ่าย" description="จัดการ workflow อนุมัติรายจ่าย" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="รออนุมัติ" value={pending + " รายการ"} icon={<Clock size={20} />} color="text-yellow-500" />
        <StatsCard label="อนุมัติแล้ว" value={approved + " รายการ"} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="ปฏิเสธ" value={rejected + " รายการ"} icon={<AlertTriangle size={20} />} color="text-red-500" />
      </div>

      <DataTable columns={columns} data={data} rowKey={(r) => r._id} dateField="rawDate" columnConfigKey="approvals" />
    </div>
  );
}
