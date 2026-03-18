"use client";
import { useTheme } from "@/contexts/ThemeContext";
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
  id: string;
  date: string;
  desc: string;
  currency: string;
  amount: number;
  thb: number;
}

interface CurrencyClientProps {
  transactions: CurrencyTx[];
}

export default function CurrencyClient({ transactions }: CurrencyClientProps) {
  const { isDark } = useTheme();
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
      <PageHeader title="สกุลเงิน" description="อัตราแลกเปลี่ยนและรายการต่างสกุลเงิน" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {RATES.map((r) => (
          <div key={r.code} className={`${card} border ${border} rounded-2xl p-4 text-center`}>
            <div className="text-2xl mb-1">{r.flag}</div>
            <p className={`text-sm font-bold ${txt}`}>{r.code}</p>
            <p className={`text-xs ${sub}`}>{r.name}</p>
            <p className={`text-sm font-semibold mt-2 ${txt}`}>{r.isDefault ? "สกุลหลัก" : `฿${r.rate}`}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={transactions} rowKey={(r) => r.id} />
    </div>
  );
}
