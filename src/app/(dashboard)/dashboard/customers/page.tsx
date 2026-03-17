"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Users, Plus, Trash2, Search } from "lucide-react";
const INIT = [
  { id: 1, name: "บจก.สยามเทค โซลูชั่น", taxId: "0105560012345", email: "finance@siamtech.co.th", phone: "02-123-4567", total: 450000, active: true },
  { id: 2, name: "หจก.กรุงเทพการค้า", taxId: "0103540098765", email: "account@bkktrade.com", phone: "02-234-5678", total: 280000, active: true },
  { id: 3, name: "บจก.ดิจิตอลเวิร์ค", taxId: "0105580034567", email: "ap@digitalwork.co.th", phone: "02-345-6789", total: 190000, active: true },
  { id: 4, name: "ร้านสหกิจ", taxId: "3100600012345", email: "sahakij@gmail.com", phone: "081-234-5678", total: 85000, active: true },
  { id: 5, name: "บจก.ไทยซอฟต์แวร์", taxId: "0105570045678", email: "billing@thaisoft.co.th", phone: "02-456-7890", total: 520000, active: true },
  { id: 6, name: "บมจ.เอเชียพลัส", taxId: "0107540056789", email: "finance@asiaplus.co.th", phone: "02-567-8901", total: 780000, active: false },
  { id: 7, name: "หจก.นวมินทร์ เซอร์วิส", taxId: "0103550067890", email: "acc@nawamin.com", phone: "02-678-9012", total: 120000, active: true },
  { id: 8, name: "บจก.สมาร์ท โลจิสติกส์", taxId: "0105590078901", email: "ar@smartlog.co.th", phone: "02-789-0123", total: 340000, active: true },
];
export default function CustomersPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(INIT);
  const [q, setQ] = useState("");
  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";
  const filtered = data.filter(d => d.name.includes(q) || d.email.includes(q));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${t}`}>รายชื่อลูกค้า</h1>
          <p className={`text-sm ${s}`}>จัดการลูกค้าและคู่ค้า</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setData([])} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"} transition-colors`}><Trash2 size={16} />ล้างข้อมูลตัวอย่าง</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors"><Plus size={16} />เพิ่มลูกค้า</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ l: "ลูกค้าทั้งหมด", v: `${data.length}` }, { l: "ใช้งาน", v: `${data.filter(d=>d.active).length}` }, { l: "ยอดค้างชำระรวม", v: `฿${data.reduce((a,d)=>a+d.total,0).toLocaleString()}` }].map((x,i) => (
          <div key={i} className={`${c} border ${b} rounded-2xl p-5`}><p className={`text-sm ${s}`}>{x.l}</p><p className={`text-2xl font-bold mt-1 ${t}`}>{x.v}</p></div>
        ))}
      </div>
      <div className={`${c} border ${b} rounded-xl px-4 py-2.5 flex items-center gap-2`}><Search size={16} className={s} /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาลูกค้า..." className={`flex-1 bg-transparent outline-none text-sm ${t} placeholder:${s}`}/></div>
      <div className={`${c} border ${b} rounded-2xl overflow-hidden`}>
        <table className="w-full"><thead><tr className={`text-left text-xs font-semibold ${s} ${isDark?"bg-white/3":"bg-gray-50"}`}><th className="px-5 py-3">ชื่อ</th><th className="px-5 py-3">เลขผู้เสียภาษี</th><th className="px-5 py-3">อีเมล</th><th className="px-5 py-3">โทรศัพท์</th><th className="px-5 py-3 text-right">ยอดสะสม</th><th className="px-5 py-3">สถานะ</th></tr></thead>
        <tbody>{filtered.length===0?<tr><td colSpan={6} className={`px-5 py-12 text-center ${s}`}>ไม่มีข้อมูล</td></tr>:filtered.map(r=>(
          <tr key={r.id} className={`border-t ${b} ${isDark?"hover:bg-white/3":"hover:bg-gray-50"} transition-colors`}><td className={`px-5 py-3 text-sm font-medium ${t}`}>{r.name}</td><td className={`px-5 py-3 text-sm ${s}`}>{r.taxId}</td><td className={`px-5 py-3 text-sm ${s}`}>{r.email}</td><td className={`px-5 py-3 text-sm ${s}`}>{r.phone}</td><td className={`px-5 py-3 text-sm font-semibold text-right ${t}`}>฿{r.total.toLocaleString()}</td><td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${r.active?"bg-green-500/10 text-green-400":"bg-gray-500/10 text-gray-400"}`}>{r.active?"ใช้งาน":"ไม่ใช้งาน"}</span></td></tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}
