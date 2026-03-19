"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  CheckCircle, XCircle, Search, ImageIcon, Banknote,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import Select from "@/components/dashboard/Select";
import Baht from "@/components/dashboard/Baht";

interface ReceiptRow {
  _id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  receiptDate: string;
  time: string;
  status: string;
  source: string;
  note: string;
  direction: string;
  hasImage: boolean;
  paymentMethod: string;
  vat: number;
  wht: number;
  companyNote: string;
  hasCompanySlip: boolean;
}

export default function ReimbursementClient({ receipts: initial }: { receipts: ReceiptRow[] }) {
  const { isDark } = useTheme();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [receipts] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isFromPersonal = (r: ReceiptRow) => (r.note || "").includes("ค่าใช้จ่ายบริษัท จากส่วนตัว");

  const stats = useMemo(() => {
    const all = receipts.filter(isFromPersonal);
    return {
      paid: all.filter((r) => r.status === "paid").length,
      paidAmount: all.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0),
      rejected: all.filter((r) => r.status === "cancelled").length,
      total: all.length,
    };
  }, [receipts]);

  const filtered = useMemo(() => {
    let data = receipts.filter(isFromPersonal);
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.merchant.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    return data;
  }, [receipts, statusFilter, search]);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "paid", label: "จ่ายแล้ว" },
    { value: "cancelled", label: "ปฏิเสธ" },
  ];

  const columns: Column<ReceiptRow>[] = useMemo(() => [
    {
      key: "image" as any, label: "รูป", configurable: false,
      render: (r) => r.hasImage
        ? <img src={`/api/receipts/image?id=${r._id}`} alt="" className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
        : <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}><ImageIcon size={14} className={isDark ? "text-white/20" : "text-gray-300"} /></div>,
    },
    {
      key: "merchant", label: "รายการ",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.merchant}</p>
          <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.category}</p>
        </div>
      ),
    },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} /> },
    {
      key: "date", label: "วันที่",
      render: (r) => r.date ? <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</span> : <span className={c("text-white/30", "text-gray-400")}>-</span>,
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => {
        if (r.status === "paid") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-400">จ่ายแล้ว</span>;
        if (r.status === "cancelled") return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400">ปฏิเสธ</span>;
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-500/10 text-gray-400">{r.status}</span>;
      },
    },
    {
      key: "paymentMethod" as any, label: "เอกสาร / หมายเหตุ",
      render: (r) => {
        const ref = (r.paymentMethod || "").replace("โอน ref: ", "");
        return (
          <div className="space-y-0.5">
            {ref && <p className={`text-xs ${c("text-white/50", "text-gray-500")}`}>Ref: {ref}</p>}
            {r.companyNote && <p className={`text-xs ${c("text-white/60", "text-gray-600")}`}>{r.companyNote}</p>}
            {r.hasCompanySlip && (
              <a href={`/api/receipts/company-slip?id=${r._id}`} target="_blank" className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                <ImageIcon size={11} />ดูสลิปแนบ
              </a>
            )}
            {!ref && !r.companyNote && !r.hasCompanySlip && <span className={c("text-white/30", "text-gray-400")}>—</span>}
          </div>
        );
      },
    },
  ], [isDark]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  return (
    <div className="space-y-6">
      <PageHeader title="ค่าใช้จ่ายบริษัท" description="รายการที่อนุมัติจ่ายแล้วจากหน้าอนุมัติรายจ่าย" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="จ่ายแล้ว" value={`${stats.paid} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="ยอดจ่ายทั้งหมด" value={`฿${stats.paidAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<Banknote size={20} />} color="text-blue-500" />
        <StatsCard label="ปฏิเสธ" value={`${stats.rejected} รายการ`} icon={<XCircle size={20} />} color="text-red-500" />
        <StatsCard label="ทั้งหมด" value={`${stats.total} รายการ`} icon={<Banknote size={20} />} color="text-purple-500" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-36"><Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} /></div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r._id}
        dateField="date"
        emptyText="ยังไม่มีรายการ — รายการจะปรากฏเมื่ออนุมัติจ่ายจากหน้าอนุมัติรายจ่ายแล้ว"
        columnConfigKey="reimbursement"
        expandRender={(r, dark) => {
          const ref = (r.paymentMethod || "").replace("โอน ref: ", "");
          const border = dark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
          const bg = dark ? "bg-[rgba(255,255,255,0.02)]" : "bg-gray-50";
          const sub = dark ? "text-white/40" : "text-gray-500";
          const txt = dark ? "text-white" : "text-gray-900";
          return (
            <div className={`p-4 ${bg} rounded-xl border ${border} space-y-3`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><p className={`text-[10px] ${sub}`}>ร้านค้า/ผู้รับเงิน</p><p className={`text-sm font-medium ${txt}`}>{r.merchant}</p></div>
                <div><p className={`text-[10px] ${sub}`}>หมวดหมู่</p><p className={`text-sm ${txt}`}>{r.category}</p></div>
                <div><p className={`text-[10px] ${sub}`}>วันที่ในใบเสร็จ</p><p className={`text-sm ${txt}`}>{r.receiptDate || "-"}{r.time ? ` ${r.time}` : ""}</p></div>
                <div><p className={`text-[10px] ${sub}`}>จำนวนเงิน</p><p className={`text-sm font-bold ${txt}`}>฿{r.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p></div>
              </div>
              {(r.vat > 0 || r.wht > 0) && (
                <div className="flex gap-4">
                  {r.vat > 0 && <div><p className={`text-[10px] ${sub}`}>VAT</p><p className={`text-sm ${txt}`}>฿{r.vat.toLocaleString()}</p></div>}
                  {r.wht > 0 && <div><p className={`text-[10px] ${sub}`}>WHT</p><p className={`text-sm ${txt}`}>฿{r.wht.toLocaleString()}</p></div>}
                </div>
              )}
              {ref && <div><p className={`text-[10px] ${sub}`}>เลขอ้างอิง Ref</p><p className={`text-sm font-mono ${txt}`}>{ref}</p></div>}
              {r.companyNote && <div><p className={`text-[10px] ${sub}`}>หมายเหตุจากบริษัท</p><p className={`text-sm ${txt}`}>{r.companyNote}</p></div>}
              <div className="flex gap-3">
                {r.hasImage && (
                  <div>
                    <p className={`text-[10px] ${sub} mb-1`}>ใบเสร็จต้นฉบับ</p>
                    <img src={`/api/receipts/image?id=${r._id}`} alt="" className="h-32 rounded-lg object-contain border border-white/10" loading="lazy" />
                  </div>
                )}
                {r.hasCompanySlip && (
                  <div>
                    <p className={`text-[10px] ${sub} mb-1`}>สลิปจากบริษัท</p>
                    <img src={`/api/receipts/company-slip?id=${r._id}`} alt="" className="h-32 rounded-lg object-contain border border-white/10" loading="lazy" />
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
