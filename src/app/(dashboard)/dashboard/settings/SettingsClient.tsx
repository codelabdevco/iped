"use client";

import { useState, useEffect } from "react";
import { User, Bell, Palette, Shield, Link2, Building2, Trash2, Download, Smartphone, Monitor, Eye, MessageCircle, FileSpreadsheet, Mail, HardDrive, Sheet, BookOpen, Clock, Users, CheckSquare, Receipt as ReceiptIcon, Globe } from "lucide-react";
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

const allTabs = [
  { id: "profile", label: "โปรไฟล์", icon: User, modes: ["personal", "business"] },
  { id: "company", label: "ข้อมูลบริษัท", icon: Building2, modes: ["business"] },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell, modes: ["personal", "business"] },
  { id: "connections", label: "การเชื่อมต่อ", icon: Link2, modes: ["personal", "business"] },
  { id: "preferences", label: "ตั้งค่าทั่วไป", icon: Palette, modes: ["personal", "business"] },
  { id: "security", label: "ความปลอดภัย", icon: Shield, modes: ["personal", "business"] },
  { id: "privacy", label: "ความเป็นส่วนตัว", icon: Eye, modes: ["personal", "business"] },
] as const;

type TabId = (typeof allTabs)[number]["id"];
type Mode = "personal" | "business";

export default function SettingsClient({ profile }: { profile: Profile }) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("personal");

  useEffect(() => {
    const m = localStorage.getItem("iped-mode");
    if (m === "business") setMode("business");
  }, []);

  const isBiz = mode === "business";
  const tabs = allTabs.filter((t) => t.modes.includes(mode));

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const inputCls = isDark ? "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-white" : "bg-gray-50 border-gray-200 text-gray-900";
  const labelCls = isDark ? "text-white/60" : "text-gray-600";
  const itemCls = `flex items-center justify-between p-4 rounded-xl border ${border} ${isDark ? "hover:bg-white/3" : "hover:bg-gray-50"} transition-colors`;
  const sectionTitle = `text-sm font-semibold ${txt}`;

  const handleSave = async () => { setSaving(true); await new Promise((r) => setTimeout(r, 1000)); setSaving(false); };

  const Toggle = ({ on = true }: { on?: boolean }) => {
    const [checked, setChecked] = useState(on);
    return (
      <button onClick={() => setChecked(!checked)} className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-[#FA3633]" : isDark ? "bg-white/10" : "bg-gray-300"}`}>
        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    );
  };

  const SelectField = ({ label, options }: { label: string; options: string[][] }) => (
    <div>
      <label className={`block text-sm ${labelCls} mb-1.5`}>{label}</label>
      <select className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  const InputField = ({ label, type = "text", value = "" }: { label: string; type?: string; value?: string }) => (
    <div>
      <label className={`block text-sm ${labelCls} mb-1.5`}>{label}</label>
      <input type={type} defaultValue={value} className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
    </div>
  );

  const SaveBtn = () => (
    <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-[#FA3633] text-white rounded-xl text-sm font-medium hover:bg-[#e0302d] disabled:opacity-50 transition-colors">
      {saving ? "กำลังบันทึก..." : "บันทึก"}
    </button>
  );

  const Divider = () => <hr className={border} />;

  return (
    <div className="space-y-6">
      <PageHeader title="ตั้งค่า" description={isBiz ? "จัดการข้อมูลบริษัทและการตั้งค่า" : "จัดการข้อมูลส่วนตัวและการตั้งค่า"} />

      <div className={`flex gap-1 ${card} border ${border} rounded-xl p-1 overflow-x-auto`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-[#FA3633]/10 text-[#FA3633]" : isDark ? "text-white/60 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>
              <Icon size={16} />{tab.label}
            </button>
          );
        })}
      </div>

      <div className={`${card} border ${border} rounded-2xl p-6`}>

        {/* ── โปรไฟล์ ── */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {profile.pictureUrl ? (
                <Image src={profile.pictureUrl} alt="" width={64} height={64} className="rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#FA3633]/20 text-[#FA3633] flex items-center justify-center text-xl font-bold">{profile.displayName.charAt(0)}</div>
              )}
              <div>
                <h3 className={`font-medium ${txt}`}>{profile.displayName}</h3>
                <p className={`text-sm ${sub}`}>{isBiz ? "บัญชีธุรกิจ" : "บัญชีส่วนตัว"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="วันเกิด" type="date" value={profile.birthDate} />
              <SelectField label="เพศ" options={[["male", "ชาย"], ["female", "หญิง"], ["other", "อื่นๆ"]]} />
              <InputField label="อาชีพ" value={profile.occupation} />
              <SelectField label="ประเภทบัญชี" options={[["personal", "ส่วนตัว"], ["business", "ธุรกิจ"]]} />
              {isBiz && <InputField label="ตำแหน่งในบริษัท" value="ผู้จัดการฝ่ายการเงิน" />}
              {isBiz && <InputField label="แผนก" value="การเงิน" />}
            </div>
            <SaveBtn />
          </div>
        )}

        {/* ── ข้อมูลบริษัท ── */}
        {activeTab === "company" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="ชื่อบริษัท" value="บริษัท ตัวอย่าง จำกัด" />
              <InputField label="เลขผู้เสียภาษี" value="0105560012345" />
              <InputField label="ที่อยู่" value="123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110" />
              <InputField label="โทรศัพท์" value="02-123-4567" />
              <InputField label="อีเมลบริษัท" value="finance@company.co.th" />
              <InputField label="เว็บไซต์" value="https://company.co.th" />
              <InputField label="สาขา" value="สำนักงานใหญ่" />
              <InputField label="ประเภทธุรกิจ" value="เทคโนโลยีสารสนเทศ" />
            </div>
            <div>
              <label className={`block text-sm ${labelCls} mb-1.5`}>โลโก้บริษัท</label>
              <div className={`border-2 border-dashed ${border} rounded-xl p-8 text-center ${isDark ? "hover:bg-white/3" : "hover:bg-gray-50"} transition-colors cursor-pointer`}>
                <Building2 size={32} className={`mx-auto ${muted} mb-2`} />
                <p className={`text-sm ${sub}`}>คลิกเพื่ออัปโหลดโลโก้</p>
                <p className={`text-xs ${muted}`}>PNG, JPG ขนาดไม่เกิน 2MB</p>
              </div>
            </div>
            <SaveBtn />
          </div>
        )}

        {/* ── การแจ้งเตือน ── */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={sectionTitle}>ทั่วไป</h3>
              {[
                { label: "แจ้งเตือนใบเสร็จใหม่", desc: "รับการแจ้งเตือนเมื่อสแกนใบเสร็จสำเร็จ", on: true },
                { label: "สรุปรายวัน", desc: "รับสรุปรายจ่ายประจำวันผ่าน LINE", on: false },
                { label: "แจ้งเตือนงบประมาณ", desc: "แจ้งเตือนเมื่อใช้จ่ายใกล้ถึงงบที่ตั้งไว้", on: true },
                { label: "ใบเสร็จซ้ำ", desc: "แจ้งเตือนเมื่อพบใบเสร็จที่อาจซ้ำกัน", on: true },
                { label: "บิลครบกำหนด", desc: "แจ้งเตือนก่อนบิลครบกำหนดชำระ", on: true },
                { label: "รายงานรายสัปดาห์", desc: "รับสรุปรายจ่ายรายสัปดาห์ผ่าน LINE", on: false },
              ].map((item) => (
                <div key={item.label} className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>{item.label}</p><p className={`text-xs ${muted} mt-0.5`}>{item.desc}</p></div><Toggle on={item.on} /></div>
              ))}
            </div>
            {isBiz && <>
              <Divider />
              <div className="space-y-4">
                <h3 className={sectionTitle}>สำหรับบริษัท</h3>
                {[
                  { label: "อนุมัติรายจ่ายใหม่", desc: "แจ้งเตือนเมื่อมีรายจ่ายรอการอนุมัติ", on: true },
                  { label: "ใบแจ้งหนี้ครบกำหนด", desc: "แจ้งเตือนก่อนใบแจ้งหนี้ครบกำหนดชำระ 3 วัน", on: true },
                  { label: "พนักงานใหม่เข้าร่วม", desc: "แจ้งเตือนเมื่อมีพนักงานใหม่เข้าสู่ระบบ", on: true },
                  { label: "VAT/WHT ครบกำหนดยื่น", desc: "แจ้งเตือนก่อนกำหนดยื่นภาษี 7 วัน", on: true },
                ].map((item) => (
                  <div key={item.label} className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>{item.label}</p><p className={`text-xs ${muted} mt-0.5`}>{item.desc}</p></div><Toggle on={item.on} /></div>
                ))}
              </div>
            </>}
          </div>
        )}

        {/* ── การเชื่อมต่อ ── */}
        {activeTab === "connections" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={sectionTitle}>บริการที่เชื่อมต่อ</h3>
              {[
                { name: "LINE", desc: "Login + แจ้งเตือน + LINE Bot", icon: MessageCircle, color: "#06C755", connected: true },
                { name: "Google Drive", desc: "สำรองเอกสาร", icon: HardDrive, color: "#4285F4", connected: true },
                { name: "Gmail", desc: "สแกนเอกสารจากอีเมล", icon: Mail, color: "#EA4335", connected: false },
                { name: "Google Sheets", desc: "ซิงค์ข้อมูลรายจ่าย", icon: Sheet, color: "#0F9D58", connected: false },
                { name: "Notion", desc: "ซิงค์ข้อมูลไป Notion", icon: BookOpen, color: "#000000", connected: false },
                ...(isBiz ? [
                  { name: "PEAK", desc: "เชื่อมโปรแกรมบัญชี PEAK", icon: FileSpreadsheet, color: "#4F46E5", connected: false },
                  { name: "FlowAccount", desc: "เชื่อมโปรแกรมบัญชี FlowAccount", icon: FileSpreadsheet, color: "#FF6B00", connected: false },
                ] : []),
              ].map((svc) => {
                const Icon = svc.icon;
                return (
                  <div key={svc.name} className={itemCls}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: svc.color + "15" }}><Icon size={20} style={{ color: svc.color }} /></div>
                      <div><p className={`text-sm font-medium ${txt}`}>{svc.name}</p><p className={`text-xs ${muted} mt-0.5`}>{svc.desc}</p></div>
                    </div>
                    <button className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${svc.connected ? isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600" : isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {svc.connected ? "เชื่อมต่อแล้ว" : "เชื่อมต่อ"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ตั้งค่าทั่วไป ── */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={sectionTitle}>การแสดงผล</h3>
              <SelectField label="สกุลเงินหลัก" options={[["THB", "THB — บาท"], ["USD", "USD — ดอลลาร์"], ["EUR", "EUR — ยูโร"]]} />
              <SelectField label="ภาษา OCR" options={[["th", "ไทย"], ["en", "English"], ["auto", "อัตโนมัติ"]]} />
              <SelectField label="รูปแบบวันที่" options={[["th", "DD/MM/YYYY (พ.ศ.)"], ["en", "MM/DD/YYYY (ค.ศ.)"], ["iso", "YYYY-MM-DD"]]} />
              <SelectField label="เขตเวลา" options={[["asia-bkk", "เอเชีย/กรุงเทพ (GMT+7)"], ["utc", "UTC"]]} />
            </div>
            {isBiz && <>
              <Divider />
              <div className="space-y-4">
                <h3 className={sectionTitle}>สำหรับบริษัท</h3>
                <SelectField label="ปีภาษี" options={[["2569", "พ.ศ. 2569"], ["2568", "พ.ศ. 2568"]]} />
                <InputField label="รูปแบบเลขที่เอกสาร" value="INV-{YYYY}-{###}" />
                <SelectField label="อัตรา VAT (%)" options={[["7", "7%"], ["0", "0% (ยกเว้น)"]]} />
                <SelectField label="รอบบัญชี" options={[["jan-dec", "มกราคม — ธันวาคม"], ["apr-mar", "เมษายน — มีนาคม"]]} />
              </div>
            </>}
            <SaveBtn />
          </div>
        )}

        {/* ── ความปลอดภัย ── */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={sectionTitle}>รหัสผ่าน</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="รหัสผ่านปัจจุบัน" type="password" />
                <div />
                <InputField label="รหัสผ่านใหม่" type="password" />
                <InputField label="ยืนยันรหัสผ่านใหม่" type="password" />
              </div>
              <button className="px-6 py-2.5 bg-[#FA3633] text-white rounded-xl text-sm font-medium hover:bg-[#e0302d] transition-colors">เปลี่ยนรหัสผ่าน</button>
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className={sectionTitle}>การยืนยันตัวตน 2 ขั้นตอน (2FA)</h3>
              <div className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>เปิดใช้งาน 2FA</p><p className={`text-xs ${muted} mt-0.5`}>เพิ่มความปลอดภัยด้วย OTP ผ่าน LINE หรือ Authenticator</p></div><Toggle on={false} /></div>
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className={sectionTitle}>เซสชันที่เข้าสู่ระบบ</h3>
              {[
                { device: "Chrome — Windows", location: "กรุงเทพฯ", time: "ขณะนี้", icon: Monitor, current: true },
                { device: "Safari — iPhone 15", location: "กรุงเทพฯ", time: "2 ชม.ที่แล้ว", icon: Smartphone, current: false },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.device} className={itemCls}>
                    <div className="flex items-center gap-3">
                      <Icon size={20} className={sub} />
                      <div><p className={`text-sm font-medium ${txt}`}>{s.device} {s.current && <span className="text-xs text-green-500 ml-1">กำลังใช้งาน</span>}</p><p className={`text-xs ${muted} mt-0.5`}>{s.location} · {s.time}</p></div>
                    </div>
                    {!s.current && <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">ออกจากระบบ</button>}
                  </div>
                );
              })}
            </div>

            {isBiz && <>
              <Divider />
              <div className="space-y-4">
                <h3 className={sectionTitle}>สำหรับบริษัท</h3>
                <div className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>จำกัดสิทธิ์ตามบทบาท</p><p className={`text-xs ${muted} mt-0.5`}>กำหนดสิทธิ์ Admin / Manager / User ให้พนักงาน</p></div><Toggle on={true} /></div>
                <div className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>IP Whitelist</p><p className={`text-xs ${muted} mt-0.5`}>อนุญาตเฉพาะ IP ที่กำหนดเข้าสู่ระบบ</p></div><Toggle on={false} /></div>
                <div className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>Session Timeout</p><p className={`text-xs ${muted} mt-0.5`}>ออกจากระบบอัตโนมัติเมื่อไม่ใช้งาน</p></div><SelectField label="" options={[["30", "30 นาที"], ["60", "1 ชั่วโมง"], ["120", "2 ชั่วโมง"], ["480", "8 ชั่วโมง"]]} /></div>
              </div>
            </>}
          </div>
        )}

        {/* ── ความเป็นส่วนตัว ── */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={sectionTitle}>ข้อมูลส่วนบุคคล (PDPA)</h3>
              <div className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>ความยินยอมในการเก็บข้อมูล</p><p className={`text-xs ${muted} mt-0.5`}>คุณได้ยินยอมให้จัดเก็บข้อมูลเมื่อ 15/01/2569</p></div><span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400">ยินยอมแล้ว</span></div>
              <div className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>นโยบายความเป็นส่วนตัว</p><p className={`text-xs ${muted} mt-0.5`}>อัปเดตล่าสุด 01/01/2569</p></div><button className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} transition-colors`}>ดูรายละเอียด</button></div>
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className={sectionTitle}>จัดการข้อมูล</h3>
              <div className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>ดาวน์โหลดข้อมูลทั้งหมด</p><p className={`text-xs ${muted} mt-0.5`}>ส่งออกข้อมูลทุกอย่างในบัญชีเป็นไฟล์ ZIP</p></div><button className="px-4 py-2 rounded-xl text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"><Download size={14} />ดาวน์โหลด</button></div>
            </div>

            {isBiz && <>
              <Divider />
              <div className="space-y-4">
                <h3 className={sectionTitle}>สำหรับบริษัท</h3>
                <SelectField label="ระยะเวลาเก็บข้อมูล (Data Retention)" options={[["365", "1 ปี"], ["730", "2 ปี"], ["1825", "5 ปี"], ["0", "ไม่จำกัด"]]} />
                <div className={itemCls}><div><p className={`text-sm font-medium ${txt}`}>ส่งออก Audit Logs</p><p className={`text-xs ${muted} mt-0.5`}>ดาวน์โหลดบันทึกการใช้งานทั้งหมด</p></div><button className="px-4 py-2 rounded-xl text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"><Download size={14} />ส่งออก</button></div>
              </div>
            </>}

            <Divider />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-red-500">โซนอันตราย</h3>
              <div className={`${itemCls} border-red-500/20`}><div><p className="text-sm font-medium text-red-500">ลบบัญชี</p><p className={`text-xs ${muted} mt-0.5`}>ลบข้อมูลทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้</p></div><button className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"><Trash2 size={14} />ลบบัญชี</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
