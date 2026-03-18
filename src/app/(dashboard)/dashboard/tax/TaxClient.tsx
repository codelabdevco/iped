"use client";
import { useTheme } from "@/contexts/ThemeContext";
import { Receipt, Calculator, FileText } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";

interface WhtRow {
  _id: string;
  name: string;
  rate: number;
  amount: number;
  date: string;
  status: string;
}

interface TaxClientProps {
  vat: { sales: number; purchase: number; net: number };
  wht: WhtRow[];
}

export default function TaxClient({ vat, wht }: TaxClientProps) {
  const { isDark } = useTheme();

  const columns: Column<WhtRow>[] = [
    { key: "name", label: "ผู้ถูกหัก" },
    { key: "rate", label: "อัตรา%", align: "right", render: (r) => <>{r.rate}%</> },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <>฿{r.amount.toLocaleString()}</> },
    { key: "date", label: "วันที่" },
    { key: "status", label: "สถานะ", render: (r) => <span className={`px-2 py-1 rounded-full text-xs ${r.status === "ยื่นแล้ว" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="VAT / WHT" description="จัดการภาษีมูลค่าเพิ่มและภาษีหัก ณ ที่จ่าย" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="ภาษีขาย" value={`฿${vat.sales.toLocaleString()}`} icon={<Receipt size={20} />} color="text-blue-500" />
        <StatsCard label="ภาษีซื้อ" value={`฿${vat.purchase.toLocaleString()}`} icon={<FileText size={20} />} color="text-orange-500" />
        <StatsCard label="VAT สุทธิ" value={`฿${vat.net.toLocaleString()}`} icon={<Calculator size={20} />} color="text-green-500" />
      </div>

      <DataTable columns={columns} data={wht} rowKey={(r) => r._id} />
    </div>
  );
}
