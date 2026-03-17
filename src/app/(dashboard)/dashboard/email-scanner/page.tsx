"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Mail, Trash2, Paperclip } from "lucide-react";
const INIT = [
  { id: 1, subject: "ใบเสร็จค่าบริการ Cloud - มี.ค. 2569", sender: "billing@aws.amazon.com", date: "15/03/2569", attachments: 1, status: "scanned" },
  { id: 2, subject: "ใบแจ้งหนี้ค่าโทรศัพท์", sender: "billing@truemoveh.com", date: "14/03/2569", attachments: 1, status: "scanned" },
  { id: 3, subject: "Payment Receipt - Figma Pro", sender: "receipts@figma.com", date: "12/03/2569", attachments: 2, status: "scanned" },
  { id: 4, subject: "ใบเสร็จค่าประกัน", sender: "service@aia.co.th", date: "10/03/2569", attachments: 1, status: "processing" },
  { id: 5, subject: "Invoice #4521 - Hosting", sender: "billing@hostinger.com", date: "08/03/2569", attachments: 1, status: "scanned" },
];
const stMap: Record<string,{label:string;cls:string}> = { scanned: { label: "สแกนแล้ว", cls: "bg-green-500/10 text-green-400" }, processing: { label: "กำลังประมวลผล", cls: "bg-yellow-500/10 text-yellow-400" } };
export default function EmailScannerPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className={`text-2xl font-bold ${t}`}>Email Scanner</h1><p className={`text-sm ${s}`}>สแกนเอกสารจากอีเมลอัตโนมัติ</p></div>
        <button onClick={() => setData([])} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"} transition-colors`}><Trash2 size={16} />ล้างข้อมูลตัวอย่าง</button>
      </div>
      <div className={`${c} border ${b} rounded-2xl p-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Mail size={20} className="text-blue-500" /></div><div><p className={`font-semibold ${t}`}>Gmail เชื่อมต่อแล้ว</p><p className={`text-sm ${s}`}>demo@iped.co</p></div></div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400`}>ใช้งานอยู่</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ l: "อีเมลที่สแกน", v: `${data.length}` }, { l: "เอกสารที่พบ", v: `${data.reduce((a,d)=>a+d.attachments,0)}` }, { l: "จัดหมวดอัตโนมัติ", v: `${data.filter(d=>d.status==="scanned").length}` }].map((x,i) => (
          <div key={i} className={`${c} border ${b} rounded-2xl p-5`}><p className={`text-sm ${s}`}>{x.l}</p><p className={`text-2xl font-bold mt-1 ${t}`}>{x.v}</p></div>
        ))}
      </div>
      <div className={`${c} border ${b} rounded-2xl overflow-hidden`}>
        <table className="w-full"><thead><tr className={`text-left text-xs font-semibold ${s} ${isDark?"bg-white/3":"bg-gray-50"}`}><th className="px-5 py-3">หัวข้อ</th><th className="px-5 py-3">ผู้ส่ง</th><th className="px-5 py-3">วันที่</th><th className="px-5 py-3">แนบ</th><th className="px-5 py-3">สถานะ</th></tr></thead>
        <tbody>{data.length===0?<tr><td colSpan={5} className={`px-5 py-12 text-center ${s}`}>ไม่มีข้อมูล</td></tr>:data.map(r=>{const st=stMap[r.status];return(
          <tr key={r.id} className={`border-t ${b} ${isDark?"hover:bg-white/3":"hover:bg-gray-50"} transition-colors`}><td className={`px-5 py-3 text-sm font-medium ${t}`}>{r.subject}</td><td className={`px-5 py-3 text-sm ${s}`}>{r.sender}</td><td className={`px-5 py-3 text-sm ${s}`}>{r.date}</td><td className="px-5 py-3 text-sm"><span className="flex items-center gap-1"><Paperclip size={12} className={s}/><span className={s}>{r.attachments}</span></span></td><td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span></td></tr>
        );})}</tbody></table>
      </div>
    </div>
  );
}
