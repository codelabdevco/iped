"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Cloud, HardDrive, Sheet, BookOpen, Trash2, RefreshCw } from "lucide-react";
const SERVICES = [
  { id: "drive", name: "Google Drive", icon: HardDrive, color: "#4285F4", connected: true, lastSync: "5 นาทีที่แล้ว", items: 142 },
  { id: "sheets", name: "Google Sheets", icon: Sheet, color: "#0F9D58", connected: true, lastSync: "1 ชม.ที่แล้ว", items: 89 },
  { id: "notion", name: "Notion", icon: BookOpen, color: "#000000", connected: false, lastSync: "-", items: 0 },
];
const LOGS = [
  { id: 1, service: "Google Drive", action: "อัปโหลดใบเสร็จ 3 รายการ", status: "success", time: "5 นาทีที่แล้ว" },
  { id: 2, service: "Google Sheets", action: "ซิงค์รายจ่ายเดือน มี.ค.", status: "success", time: "1 ชม.ที่แล้ว" },
  { id: 3, service: "Google Drive", action: "สำรองเอกสาร 12 ไฟล์", status: "success", time: "3 ชม.ที่แล้ว" },
  { id: 4, service: "Google Sheets", action: "อัปเดตหมวดหมู่", status: "success", time: "เมื่อวาน" },
  { id: 5, service: "Notion", action: "พยายามเชื่อมต่อ", status: "failed", time: "2 วันที่แล้ว" },
  { id: 6, service: "Google Drive", action: "สำรองเอกสาร 8 ไฟล์", status: "success", time: "3 วันที่แล้ว" },
];
export default function SyncPage() {
  const { isDark } = useTheme();
  const [logs, setLogs] = useState(LOGS);
  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className={`text-2xl font-bold ${t}`}>Drive / Sheets / Notion</h1><p className={`text-sm ${s}`}>ซิงค์ข้อมูลกับบริการภายนอก</p></div>
        <button onClick={() => setLogs([])} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"} transition-colors`}><Trash2 size={16} />ล้างข้อมูลตัวอย่าง</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SERVICES.map(sv => { const Icon = sv.icon; return (
          <div key={sv.id} className={`${c} border ${b} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: sv.color+"15"}}><Icon size={20} style={{color: sv.color}} /></div><p className={`font-semibold ${t}`}>{sv.name}</p></div>
              <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${sv.connected ? "bg-green-500/10 text-green-400" : isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-400"}`}>{sv.connected ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className={`text-xs ${s}`}>ซิงค์ล่าสุด</p><p className={`text-sm font-medium ${t}`}>{sv.lastSync}</p></div>
              <div className="text-right"><p className={`text-xs ${s}`}>รายการ</p><p className={`text-sm font-medium ${t}`}>{sv.items}</p></div>
            </div>
            <button className={`w-full mt-4 py-2 rounded-xl text-sm font-medium transition-colors ${sv.connected ? isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-[#FA3633] text-white hover:bg-[#e0302d]"}`}>{sv.connected ? "ซิงค์ตอนนี้" : "เชื่อมต่อ"}</button>
          </div>
        );})}
      </div>
      <div className={`${c} border ${b} rounded-2xl overflow-hidden`}>
        <div className="p-5"><h3 className={`font-semibold ${t}`}>Sync Log</h3></div>
        <div className="space-y-0">{logs.length===0?<p className={`px-5 py-12 text-center ${s}`}>ไม่มีข้อมูล</p>:logs.map(l=>(
          <div key={l.id} className={`px-5 py-3 flex items-center justify-between border-t ${b}`}>
            <div className="flex items-center gap-3"><RefreshCw size={14} className={l.status==="success"?"text-green-500":"text-red-500"}/><div><p className={`text-sm ${t}`}>{l.action}</p><p className={`text-xs ${s}`}>{l.service}</p></div></div>
            <div className="flex items-center gap-3"><span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${l.status==="success"?"bg-green-500/10 text-green-400":"bg-red-500/10 text-red-400"}`}>{l.status==="success"?"สำเร็จ":"ล้มเหลว"}</span><span className={`text-xs ${s}`}>{l.time}</span></div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
