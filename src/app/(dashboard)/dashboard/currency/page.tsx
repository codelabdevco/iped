"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Globe, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

const RATES = [
  { code: "THB", name: "บาท", flag: "🇹🇭", rate: 1, isDefault: true },
  { code: "USD", name: "ดอลลาร์สหรัฐ", flag: "🇺🇸", rate: 35.42 },
  { code: "EUR", name: "ยูโร", flag: "🇪🇺", rate: 38.15 },
  { code: "JPY", name: "เยน", flag: "🇯🇵", rate: 0.237 },
  { code: "CNY", name: "หยวน", flag: "🇨🇳", rate: 4.88 },
];

interface CurrencyTx {
  id: number; date: string; desc: string; currency: string; amount: number; thb: number;
}

const INIT_TX: CurrencyTx[] = [
  { id: 1, date: "05/03/2569", desc: "Amazon.com", currency: "USD", amount: 49.99, thb: 1771 },
  { id: 2, date: "08/03/2569", desc: "Nintendo eShop Japan", currency: "JPY", amount: 7980, thb: 1891 },
  { id: 3, date: "10/03/2569", desc: "Booking.com (Paris)", currency: "EUR", amount: 125, thb: 4769 },
  { id: 4, date: "12/03/2569", desc: "AliExpress", currency: "CNY", amount: 299, thb: 1459 },
  { id: 5, date: "15/03/2569", desc: "Udemy Course", currency: "USD", amount: 12.99, thb: 460 },
];

export default function CurrencyPage() {
  const { isDark } = useTheme();
  const [txData, setTxData] = useState(INIT_TX);
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const columns: Column<CurrencyTx>[] = [
    { key: "date", label: "วันที่" },
    { key: "desc", label: "รายการ", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.desc}</span> },
    { key: "currency", label: "สกุลเงิน", render: (r, isDark) => <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.currency}</span> },
    { key: "amount", label: "จำนวนเงิน", align: "right" },
    { key: "thb", label: "เทียบ THB", align: "right", render: (r) => <span className="font-semibold text-red-500">-฿{r.thb.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="สกุลเงิน" description="อัตราแลกเปลี่ยนและรายการต่างสกุลเงิน" onClear={() => setTxData([])} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {RATES.map(r => (
          <div key={r.code} className={`${card} border ${border} rounded-2xl p-4 text-center`}>
            <div className="text-2xl mb-1">{r.flag}</div>
            <p className={`text-sm font-bold ${txt}`}>{r.code}</p>
            <p className={`text-xs ${sub}`}>{r.name}</p>
            <p className={`text-sm font-semibold mt-2 ${txt}`}>{r.isDefault ? "สกุลหลัก" : `฿${r.rate}`}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={txData} rowKey={(r) => r.id} />
    </div>
  );
}
