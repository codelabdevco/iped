"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Bot, MessageCircle, Bell, BarChart3, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
const MSGS = [
  { id: 1, from: "user", text: "ส่งรูปใบเสร็จ", time: "10:30" },
  { id: 2, from: "bot", text: "สแกนสำเร็จ! ใบเสร็จร้าน Tops Market ฿1,250 หมวดอาหาร", time: "10:30" },
  { id: 3, from: "user", text: "สรุปรายจ่ายเดือนนี้", time: "11:00" },
  { id: 4, from: "bot", text: "รายจ่ายเดือน มี.ค. 2569\n- อาหาร ฿4,200\n- เดินทาง ฿1,850\n- ช็อปปิ้ง ฿2,490\nรวม ฿8,540", time: "11:00" },
  { id: 5, from: "user", text: "เดือนนี้เหลืองบอีกเท่าไร", time: "14:15" },
  { id: 6, from: "bot", text: "งบเดือนนี้ ฿30,000 ใช้ไป ฿8,540 เหลือ ฿21,460 (71.5%)", time: "14:15" },
];
export default function LineBotPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(MSGS);
  const [connected] = useState(true);
  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";
  return (
    <div className="space-y-6">
      <PageHeader title="LINE Bot" description="ส่งรูป ถามสรุป คุยเรื่องเงินผ่าน LINE" onClear={() => setData([])} />
      <div className={`${c} border ${b} rounded-2xl p-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? "bg-green-500/10" : "bg-red-500/10"}`}><Bot size={20} className={connected ? "text-green-500" : "text-red-500"} /></div>
          <div><p className={`font-semibold ${t}`}>สถานะการเชื่อมต่อ</p><p className={`text-sm ${connected ? "text-green-500" : "text-red-500"}`}>{connected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}</p></div>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-medium bg-[#06C755] text-white">จัดการ LINE Bot</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ icon: MessageCircle, label: "ส่งรูปใบเสร็จ", desc: "สแกน OCR อัตโนมัติ" }, { icon: BarChart3, label: "ถามสรุปรายจ่าย", desc: "สรุปวัน/เดือน" }, { icon: Bell, label: "แจ้งเตือนงบ", desc: "เตือนเมื่องบใกล้หมด" }, { icon: Bot, label: "คุยเรื่องเงิน", desc: "AI ตอบคำถามการเงิน" }].map((f, i) => {
          const Icon = f.icon;
          return <div key={i} className={`${c} border ${b} rounded-2xl p-4 text-center`}><div className="w-10 h-10 rounded-xl bg-[#06C755]/10 flex items-center justify-center mx-auto mb-2"><Icon size={20} className="text-[#06C755]" /></div><p className={`text-sm font-semibold ${t}`}>{f.label}</p><p className={`text-[11px] ${s} mt-1`}>{f.desc}</p></div>;
        })}
      </div>
      <div className={`${c} border ${b} rounded-2xl p-5`}>
        <h3 className={`font-semibold mb-4 ${t}`}>ข้อความล่าสุด</h3>
        {data.length === 0 ? <p className={`text-center py-8 ${s}`}>ไม่มีข้อมูล</p> :
        <div className="space-y-3 max-h-96 overflow-y-auto">{data.map(m => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${m.from === "user" ? "bg-[#06C755] text-white rounded-br-md" : isDark ? "bg-white/5 text-white rounded-bl-md" : "bg-gray-100 text-gray-900 rounded-bl-md"}`}>
              {m.text}<div className={`text-[10px] mt-1 ${m.from === "user" ? "text-white/60" : s}`}>{m.time}</div>
            </div>
          </div>
        ))}</div>}
      </div>
    </div>
  );
}
