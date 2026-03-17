"use client";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, Users, UserPlus, Plus, Clock } from "lucide-react";

const deptData = [
  { name: "การเงิน", count: 3, icon: "💰" },
  { name: "ปฏิบัติการ", count: 3, icon: "⚙️" },
  { name: "บริหาร", count: 2, icon: "📋" },
];

const initData = [
  { name: "สมชาย วงศ์สวัสดิ์", dept: "บริหาร", position: "กรรมการผู้จัดการ", email: "somchai@company.co.th", role: "Admin", active: true },
  { name: "สุภาพร แสงทอง", dept: "การเงิน", position: "ผู้จัดการฝ่ายการเงิน", email: "supaporn@company.co.th", role: "Manager", active: true },
  { name: "วิชัย พงศ์ประเสริฐ", dept: "ปฏิบัติการ", position: "ผู้จัดการฝ่ายปฏิบัติการ", email: "wichai@company.co.th", role: "Manager", active: true },
  { name: "นภา ศรีสุข", dept: "การเงิน", position: "นักบัญชีอาวุโส", email: "napa@company.co.th", role: "User", active: true },
  { name: "ธนกร เจริญยิ่ง", dept: "ปฏิบัติการ", position: "วิศวกรระบบ", email: "thanakorn@company.co.th", role: "User", active: true },
  { name: "พิมพ์ชนก รัตนกุล", dept: "การเงิน", position: "เจ้าหน้าที่บัญชี", email: "pimchanok@company.co.th", role: "User", active: false },
  { name: "กิตติพงษ์ อมรรัตน์", dept: "ปฏิบัติการ", position: "เจ้าหน้าที่ IT", email: "kittipong@company.co.th", role: "User", active: true },
  { name: "อรุณี มงคลชัย", dept: "บริหาร", position: "ผู้ช่วยผู้จัดการ", email: "arunee@company.co.th", role: "Manager", active: true },
];

const roleColor: Record<string, string> = { Admin: "bg-purple-500/20 text-purple-400", Manager: "bg-blue-500/20 text-blue-400", User: "bg-gray-500/20 text-gray-400" };

export default function Page() {
  const { isDark } = useTheme();
  const [data, setData] = useState(initData);
  const c = (d: string, l: string) => isDark ? d : l;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${c("text-white", "text-gray-900")}`}>พนักงาน & แผนก</h1>
          <p className={`text-sm ${c("text-white/50", "text-gray-500")}`}>จัดการทีมและสิทธิ์การใช้งาน</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setData([])} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"} transition-colors`}><Trash2 size={16} />ล้างข้อมูลตัวอย่าง</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors"><Plus size={16} />เชิญพนักงาน</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {deptData.map(d => (
          <div key={d.name} className={`p-4 rounded-xl border flex items-center gap-3 ${c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
            <span className="text-2xl">{d.icon}</span>
            <div>
              <p className={`font-medium ${c("text-white", "text-gray-900")}`}>{d.name}</p>
              <p className={`text-sm ${c("text-white/50", "text-gray-500")}`}>{d.count} คน</p>
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border overflow-hidden ${c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
        <table className="w-full text-sm">
          <thead><tr className={c("border-b border-[rgba(255,255,255,0.06)]", "border-b border-gray-200")}>
            {["ชื่อ", "แผนก", "ตำแหน่ง", "อีเมล", "สิทธิ์", "สถานะ"].map(h => (
              <th key={h} className={`px-4 py-3 text-left font-medium ${c("text-white/50", "text-gray-500")}`}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map(r => (
              <tr key={r.email} className={`border-t ${c("border-[rgba(255,255,255,0.06)] hover:bg-white/5", "border-gray-100 hover:bg-gray-50")}`}>
                <td className={`px-4 py-3 font-medium ${c("text-white", "text-gray-900")}`}>{r.name}</td>
                <td className={`px-4 py-3 ${c("text-white/50", "text-gray-500")}`}>{r.dept}</td>
                <td className={`px-4 py-3 ${c("text-white/50", "text-gray-500")}`}>{r.position}</td>
                <td className={`px-4 py-3 font-mono text-xs ${c("text-white/50", "text-gray-500")}`}>{r.email}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${roleColor[r.role]}`}>{r.role}</span></td>
                <td className="px-4 py-3"><span className={`inline-block w-2 h-2 rounded-full mr-1 ${r.active ? "bg-green-400" : "bg-gray-400"}`} /><span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.active ? "ใช้งาน" : "ปิดใช้งาน"}</span></td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className={`px-4 py-12 text-center ${c("text-white/50", "text-gray-500")}`}><Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
