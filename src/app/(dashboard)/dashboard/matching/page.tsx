"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Link2, CheckCircle2, Clock, AlertTriangle, Trash2, FileText, ArrowLeftRight } from "lucide-react";

interface MatchPair {
  id: string;
  invoice: { number: string; shop: string; amount: number; date: string };
  receipt: { number: string; shop: string; amount: number; date: string } | null;
  status: "matched" | "pending" | "not_found";
}

const initialPairs: MatchPair[] = [
  {
    id: "MP001",
    invoice: { number: "INV-2026-0341", shop: "บริษัท สยามฟู้ด จำกัด", amount: 15200.0, date: "2026-03-10" },
    receipt: { number: "RCP-0341", shop: "บริษัท สยามฟู้ด จำกัด", amount: 15200.0, date: "2026-03-12" },
    status: "matched",
  },
  {
    id: "MP002",
    invoice: { number: "INV-2026-0342", shop: "ร้านวัสดุก่อสร้างเจริญชัย", amount: 8750.0, date: "2026-03-11" },
    receipt: { number: "RCP-0342", shop: "ร้านวัสดุก่อสร้างเจริญชัย", amount: 8750.0, date: "2026-03-13" },
    status: "matched",
  },
  {
    id: "MP003",
    invoice: { number: "INV-2026-0343", shop: "ห้างหุ้นส่วน ไทยออฟฟิศ", amount: 4300.0, date: "2026-03-12" },
    receipt: null,
    status: "pending",
  },
  {
    id: "MP004",
    invoice: { number: "INV-2026-0344", shop: "บริษัท โกลบอลเทค จำกัด", amount: 22500.0, date: "2026-03-13" },
    receipt: { number: "RCP-0344", shop: "บริษัท โกลบอลเทค จำกัด", amount: 22500.0, date: "2026-03-14" },
    status: "matched",
  },
  {
    id: "MP005",
    invoice: { number: "INV-2026-0345", shop: "ร้านอาหาร ครัวคุณย่า", amount: 1850.0, date: "2026-03-14" },
    receipt: null,
    status: "not_found",
  },
  {
    id: "MP006",
    invoice: { number: "INV-2026-0346", shop: "บริษัท เอ็นเนอร์ยี่พลัส จำกัด", amount: 6420.0, date: "2026-03-15" },
    receipt: null,
    status: "pending",
  },
];

export default function MatchingPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [pairs, setPairs] = useState<MatchPair[]>(initialPairs);

  const clearDemo = () => setPairs([]);

  const matched = pairs.filter((p) => p.status === "matched").length;
  const pending = pairs.filter((p) => p.status === "pending").length;
  const notFound = pairs.filter((p) => p.status === "not_found").length;

  const statusConfig = {
    matched: { label: "จับคู่แล้ว", icon: CheckCircle2, color: "text-emerald-500", bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50" },
    pending: { label: "รอจับคู่", icon: Clock, color: "text-amber-500", bg: isDark ? "bg-amber-500/10" : "bg-amber-50" },
    not_found: { label: "ไม่พบคู่", icon: AlertTriangle, color: "text-red-500", bg: isDark ? "bg-red-500/10" : "bg-red-50" },
  };

  const summaryCards = [
    { label: "จับคู่แล้ว", value: matched, color: "text-emerald-500" },
    { label: "รอจับคู่", value: pending, color: "text-amber-500" },
    { label: "ไม่พบคู่", value: notFound, color: "text-red-500" },
  ];

  const cardCls = isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200";
  const subBg = isDark ? "bg-[rgba(255,255,255,0.03)]" : "bg-gray-50";
  const tp = isDark ? "text-white" : "text-gray-900";
  const ts = isDark ? "text-gray-400" : "text-gray-500";
  const tm = isDark ? "text-gray-500" : "text-gray-400";
  const btnCls = isDark ? "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-gray-300 hover:bg-[rgba(255,255,255,0.08)]" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <Link2 className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className={"text-2xl font-bold " + tp}>จับคู่เอกสาร</h1>
            <p className={ts}>จับคู่ใบแจ้งหนี้กับใบเสร็จรับเงินอัตโนมัติ</p>
          </div>
        </div>
        <button onClick={clearDemo} className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors " + btnCls}>
          <Trash2 className="w-4 h-4" />
          ล้างข้อมูลตัวอย่าง
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={"rounded-2xl border p-4 text-center " + cardCls}>
            <p className={"text-3xl font-bold " + card.color}>{card.value}</p>
            <p className={"text-sm mt-1 " + ts}>{card.label}</p>
          </div>
        ))}
      </div>

      {pairs.length === 0 ? (
        <div className={"rounded-2xl border p-12 text-center " + cardCls}>
          <p className={tm}>ไม่มีข้อมูลตัวอย่าง</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pairs.map((pair) => {
            const cfg = statusConfig[pair.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={pair.id} className={"rounded-2xl border p-5 " + cardCls}>
                <div className="flex items-center justify-between mb-3">
                  <div className={"flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium " + cfg.bg + " " + cfg.color}>
                    <StatusIcon className="w-4 h-4" />
                    {cfg.label}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={"flex-1 rounded-xl p-3 " + subBg}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className={"w-4 h-4 " + tm} />
                      <span className={"text-xs font-medium " + ts}>ใบแจ้งหนี้</span>
                    </div>
                    <p className={"font-medium text-sm " + tp}>{pair.invoice.number}</p>
                    <p className={"text-xs " + ts}>{pair.invoice.shop}</p>
                    <p className={"text-sm font-semibold mt-1 " + tp}>
                      {"฿" + pair.invoice.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <ArrowLeftRight className={"w-5 h-5 flex-shrink-0 " + (isDark ? "text-gray-600" : "text-gray-300")} />
                  <div className={"flex-1 rounded-xl p-3 " + subBg}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className={"w-4 h-4 " + tm} />
                      <span className={"text-xs font-medium " + ts}>ใบเสร็จ</span>
                    </div>
                    {pair.receipt ? (
                      <>
                        <p className={"font-medium text-sm " + tp}>{pair.receipt.number}</p>
                        <p className={"text-xs " + ts}>{pair.receipt.shop}</p>
                        <p className={"text-sm font-semibold mt-1 " + tp}>
                          {"฿" + pair.receipt.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </p>
                      </>
                    ) : (
                      <p className={"text-sm italic " + (isDark ? "text-gray-600" : "text-gray-400")}>ยังไม่มีเอกสารคู่</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
