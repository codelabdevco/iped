"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Download, FileText, Table, Loader2, CheckCircle } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

export default function ExportPage() {
  const { isDark } = useTheme();
  const [exporting, setExporting] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const res = await fetch(`/api/receipts?limit=100`);
      const data = await res.json();
      const receipts = data.receipts || [];

      if (type === "csv") {
        const BOM = "\uFEFF";
        let csv = BOM + "ร้านค้า,หมวดหมู่,จำนวนเงิน,VAT,WHT,สถานะ,ประเภท,วิธีจ่าย,วันที่,ที่มา\n";
        receipts.forEach((r: any) => {
          csv += `"${r.merchant || ""}","${r.category || ""}",${r.amount || 0},${r.vat || 0},${r.wht || 0},"${r.status || ""}","${r.type || ""}","${r.paymentMethod || ""}","${r.date ? new Date(r.date).toLocaleDateString("th-TH") : ""}","${r.source || ""}"\n`;
        });
        downloadFile(csv, `iPED-receipts-${dateStr()}.csv`, "text/csv;charset=utf-8;");
      } else if (type === "pdf") {
        const rows = receipts.map((r: any) =>
          `<tr><td>${r.merchant || ""}</td><td>${r.category || ""}</td><td style="text-align:right">฿${(r.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td><td>${r.status || ""}</td><td>${r.date ? new Date(r.date).toLocaleDateString("th-TH") : ""}</td></tr>`
        ).join("");
        const total = receipts.reduce((s: number, r: any) => s + (r.amount || 0), 0);
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>iPED Report</title>
<style>body{font-family:'Sarabun',sans-serif;max-width:900px;margin:0 auto;padding:30px;color:#111}
h1{color:#FA3633;font-size:24px}table{width:100%;border-collapse:collapse;margin:20px 0}
th{text-align:left;padding:8px 10px;background:#f8f8f8;font-size:13px;border-bottom:2px solid #eee}
td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
.stats{display:flex;gap:12px;margin:16px 0}.stat{flex:1;background:#f8f8f8;padding:14px;border-radius:10px;text-align:center}
.stat b{font-size:20px;color:#FA3633;display:block}.stat span{font-size:11px;color:#888}
@media print{body{padding:10px}}</style></head><body>
<h1>iPED — รายงานสรุป</h1><p style="color:#888;margin-top:-8px">${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</p>
<div class="stats"><div class="stat"><b>${receipts.length}</b><span>รายการ</span></div><div class="stat"><b>฿${total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b><span>ยอดรวม</span></div></div>
<table><tr><th>ร้านค้า</th><th>หมวดหมู่</th><th style="text-align:right">จำนวนเงิน</th><th>สถานะ</th><th>วันที่</th></tr>${rows}</table>
<p style="text-align:center;color:#ccc;font-size:10px;margin-top:30px">iPED — ระบบจัดการใบเสร็จอัจฉริยะ</p></body></html>`;
        const w = window.open("", "_blank");
        if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
      }
      setDone((prev) => [...prev, type]);
    } catch {} finally { setExporting(null); }
  };

  const dateStr = () => new Date().toISOString().slice(0, 10);
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  const exports = [
    { type: "csv", label: "CSV (Excel)", desc: "ส่งออกข้อมูลทั้งหมดเป็นไฟล์ CSV เปิดใน Excel ได้", icon: Table, color: "#22c55e" },
    { type: "pdf", label: "PDF (พิมพ์ได้)", desc: "รายงานสรุปพร้อมพิมพ์ หรือบันทึกเป็น PDF", icon: FileText, color: "#EF4444" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="ส่งออกข้อมูล" description="ส่งออกใบเสร็จและรายงานในรูปแบบต่างๆ" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exports.map((exp) => {
          const Icon = exp.icon;
          const isExporting = exporting === exp.type;
          const isDone = done.includes(exp.type);
          return (
            <div key={exp.type} className={`${card} border ${border} rounded-2xl p-6`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: exp.color + "18" }}>
                  <Icon size={20} style={{ color: exp.color }} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${txt}`}>{exp.label}</p>
                  <p className={`text-xs ${muted}`}>{exp.desc}</p>
                </div>
              </div>
              <button onClick={() => handleExport(exp.type)} disabled={isExporting} className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isDone ? "bg-green-500/10 text-green-500" : "bg-[#FA3633] text-white hover:bg-[#e0302d]"} disabled:opacity-50`}>
                {isExporting ? <><Loader2 size={14} className="animate-spin" /> กำลังส่งออก...</> : isDone ? <><CheckCircle size={14} /> ส่งออกแล้ว</> : <><Download size={14} /> ส่งออก {exp.label}</>}
              </button>
            </div>
          );
        })}
      </div>

      <div className={`${card} border ${border} rounded-2xl p-6`}>
        <h3 className={`font-semibold ${txt} mb-1`}>ข้อมูลที่ส่งออก</h3>
        <p className={`text-xs ${sub} mb-4`}>ข้อมูลทั้งหมดจากใบเสร็จ / เอกสาร สูงสุด 100 รายการล่าสุด</p>
        <div className="space-y-2">
          {["ร้านค้า / ชื่อ", "หมวดหมู่", "จำนวนเงิน + VAT + WHT", "สถานะ + ประเภท", "วิธีจ่าย", "วันที่ + เวลา", "ที่มา (LINE / เว็บ)"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle size={12} className="text-green-500 shrink-0" />
              <span className={`text-xs ${txt}`}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
