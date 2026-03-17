"use client";

import { useState } from "react";
import { User, Bell, Palette } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";

interface Profile {
  displayName: string;
  pictureUrl: string;
  birthDate: string;
  gender: string;
  occupation: string;
  accountType: string;
}

const tabs = [
  { id: "profile", label: "โปรไฟล์", icon: User },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
  { id: "preferences", label: "การตั้งค่าทั่วไป", icon: Palette },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SettingsClient({ profile }: { profile: Profile }) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [saving, setSaving] = useState(false);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const inputCls = isDark
    ? "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-white"
    : "bg-gray-50 border-gray-200 text-gray-900";
  const labelCls = isDark ? "text-white/60" : "text-gray-600";

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="ตั้งค่า" description="จัดการข้อมูลส่วนตัวและการตั้งค่า" />

      {/* Tabs */}
      <div className={`flex gap-1 ${card} border ${border} rounded-xl p-1 w-fit`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#FA3633]/10 text-[#FA3633]"
                  : isDark
                    ? "text-white/60 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={`${card} border ${border} rounded-2xl p-6`}>
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {profile.pictureUrl ? (
                <Image src={profile.pictureUrl} alt="" width={64} height={64} className="rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#FA3633]/20 text-[#FA3633] flex items-center justify-center text-xl font-bold">
                  {profile.displayName.charAt(0)}
                </div>
              )}
              <div>
                <h3 className={`font-medium ${txt}`}>{profile.displayName}</h3>
                <p className={`text-sm ${sub}`}>
                  {profile.accountType === "personal" ? "บัญชีส่วนตัว" : "บัญชีธุรกิจ"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm ${labelCls} mb-1.5`}>วันเกิด</label>
                <input type="date" defaultValue={profile.birthDate} className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
              </div>
              <div>
                <label className={`block text-sm ${labelCls} mb-1.5`}>เพศ</label>
                <select defaultValue={profile.gender} className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm ${labelCls} mb-1.5`}>อาชีพ</label>
                <input type="text" defaultValue={profile.occupation} className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
              </div>
              <div>
                <label className={`block text-sm ${labelCls} mb-1.5`}>ประเภทบัญชี</label>
                <select defaultValue={profile.accountType} className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
                  <option value="personal">ส่วนตัว</option>
                  <option value="business">ธุรกิจ</option>
                </select>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-[#FA3633] text-white rounded-xl text-sm font-medium hover:bg-[#e0302d] disabled:opacity-50 transition-colors">
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            {[
              { label: "แจ้งเตือนใบเสร็จใหม่", desc: "รับการแจ้งเตือนเมื่อสแกนใบเสร็จสำเร็จ", default: true },
              { label: "สรุปรายวัน", desc: "รับสรุปรายจ่ายประจำวันผ่าน LINE", default: false },
              { label: "แจ้งเตือนงบประมาณ", desc: "แจ้งเตือนเมื่อใช้จ่ายใกล้ถึงงบที่ตั้งไว้", default: true },
              { label: "ใบเสร็จซ้ำ", desc: "แจ้งเตือนเมื่อพบใบเสร็จที่อาจซ้ำกัน", default: true },
              { label: "บิลครบกำหนด", desc: "แจ้งเตือนก่อนบิลครบกำหนดชำระ", default: true },
              { label: "รายงานรายสัปดาห์", desc: "รับสรุปรายจ่ายรายสัปดาห์ผ่าน LINE", default: false },
            ].map((item) => (
              <label
                key={item.label}
                className={`flex items-center justify-between p-4 rounded-xl border ${border} ${isDark ? "hover:bg-white/3" : "hover:bg-gray-50"} transition-colors cursor-pointer`}
              >
                <div>
                  <p className={`text-sm font-medium ${txt}`}>{item.label}</p>
                  <p className={`text-xs ${muted} mt-0.5`}>{item.desc}</p>
                </div>
                <input type="checkbox" defaultChecked={item.default} className="w-5 h-5 rounded accent-[#FA3633]" />
              </label>
            ))}
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm ${labelCls} mb-1.5`}>สกุลเงินหลัก</label>
              <select className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
                <option value="THB">THB — บาท</option>
                <option value="USD">USD — ดอลลาร์</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm ${labelCls} mb-1.5`}>ภาษา OCR</label>
              <select className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
                <option value="th">ไทย</option>
                <option value="en">English</option>
                <option value="auto">อัตโนมัติ</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
