"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, Receipt, Calculator, FileText } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

const initVat = { sales: 45000, purchase: 28000, net: 17000 };
const initWht = [
  { id: 1, name: "บริษัท สยามเทค จำกัด", type: "ค่าบริการ (ม.40(8))", rate: 3, amount: 4500, date: "2026-03-15", status: "ยื่นแล้ว" },
  { id: 2, name: "นายสมชาย วงศ์สุวรรณ", type: "ค่าจ้างทำของ (ม.40(7))", rate: 3, amount: 2100, date: "2026-03-14", status: "ยื่นแล้ว" },
  { id: 3, name: "บริษัท ดิจิทัลโปร จำกัด", type: "ค่าโฆษณา (ม.40(8))", rate: 2, amount: 1800, date: "2026-03-12", status: "รอยื่น" },
  { id: 4, name: "นางสาวพิมพ์ใจ แก้วมณี", type: "ค่าเช่า (ม.40(5))", rate: 5, amount: 3500, date: "2026-03-10", status: "ยื่นแล้ว" },
  { id: 5, name: "บริษัท คลาวด์เน็ต จำกัด", type: "ค่าบริการ (ม.40(8))", rate: 3, amount: 6000, date: "2026-03-08", status: "รอยื่น" },
  { id: 6, name: "นายวิทยา จันทร์เพ็ญ", type: "ค่าจ้างทำของ (ม.40(7))", rate: 3, amount: 1500, date: "2026-03-05", status: "ยื่นแล้ว" },
];

export default function Page() {
  const { isDark } = useTheme();
  const [vat, setVat] = useState(initVat);
  const [wht, setWht] = useState(initWht);
  const card = `rounded-xl border p-5 ${isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200"}`;
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  const clearDemo = () => { setVat({ sales: 0, purchase: 0, net: 0 }); setWht([]); };

  const vatCards = [
    { label: "ภาษีขาย", value: vat.sales, icon: Receipt, color: "text-blue-400" },
    { label: "ภาษีซื้อ", value: vat.purchase, icon: FileText, color: "text-orange-400" },
    { label: "VAT สุทธิ", value: vat.net, icon: Calculator, color: "text-green-400" },
  ];

  return (
    <div className={`p-6 space-y-6 ${txt}`}>
      <PageHeader title="VAT / WHT" description="จัดการภาษีมูลค่าเพิ่มและภาษีหัก ณ ที่จ่าย" onClear={clearDemo} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vatCards.map((c) => (
          <div key={c.label} className={card}>
            <div className="flex items-center gap-3 mb-2"><c.icon size={20} className={c.color} /><span className={sub}>{c.label}</span></div>
            <p className="text-2xl font-bold">฿{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold mb-4">รายการหัก ณ ที่จ่าย</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={sub}>
              <th className="text-left pb-3">ผู้ถูกหัก</th><th className="text-left pb-3">ประเภทเงินได้</th>
              <th className="text-right pb-3">อัตรา%</th><th className="text-right pb-3">จำนวนเงิน</th>
              <th className="text-left pb-3">วันที่</th><th className="text-left pb-3">สถานะ</th>
            </tr></thead>
            <tbody>
              {wht.map((r) => (
                <tr key={r.id} className={`border-t ${isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-100"}`}>
                  <td className="py-3">{r.name}</td><td>{r.type}</td>
                  <td className="text-right">{r.rate}%</td><td className="text-right">฿{r.amount.toLocaleString()}</td>
                  <td>{r.date}</td>
                  <td><span className={`px-2 py-1 rounded-full text-xs ${r.status === "ยื่นแล้ว" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>{r.status}</span></td>
                </tr>
              ))}
              {wht.length === 0 && <tr><td colSpan={6} className={`py-8 text-center ${sub}`}>ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
