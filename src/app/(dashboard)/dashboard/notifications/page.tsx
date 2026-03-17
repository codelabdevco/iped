"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Bell, Trash2, AlertTriangle, Receipt, Copy, Settings, CheckCheck, Circle } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

type NotifType = "budget" | "bill" | "duplicate" | "system";
type FilterTab = "all" | "unread" | "budget" | "bill" | "system";

interface Notification { id: string; type: NotifType; title: string; description: string; timeAgo: string; read: boolean; }

const initialNotifications: Notification[] = [
  { id: "N001", type: "budget", title: "งบอาหารเกินกำหนด", description: "หมวดอาหารใช้ไป 12,500 บาท จากงบ 10,000 บาท (เกิน 25%)", timeAgo: "5 นาทีที่แล้ว", read: false },
  { id: "N002", type: "bill", title: "บิลค่าไฟครบกำหนดชำระ", description: "ใบแจ้งหนี้ค่าไฟฟ้า 2,340 บาท ครบกำหนด 20 มี.ค. 2026", timeAgo: "1 ชั่วโมงที่แล้ว", read: false },
  { id: "N003", type: "duplicate", title: "พบเอกสารที่อาจซ้ำกัน", description: "ใบเสร็จจากเซเว่น 245 บาท คล้ายกัน 2 รายการ", timeAgo: "2 ชั่วโมงที่แล้ว", read: false },
  { id: "N004", type: "system", title: "อัปเดตระบบสำเร็จ", description: "ระบบ AI OCR อัปเดตเป็นเวอร์ชัน 2.4.1", timeAgo: "3 ชั่วโมงที่แล้ว", read: true },
  { id: "N005", type: "budget", title: "งบเดินทางใกล้ครบ", description: "หมวดเดินทางใช้ไป 4,200 จากงบ 5,000 บาท (84%)", timeAgo: "5 ชั่วโมงที่แล้ว", read: true },
  { id: "N006", type: "bill", title: "บิลค่าเน็ตครบกำหนด", description: "อินเทอร์เน็ต 890 บาท ครบกำหนด 22 มี.ค. 2026", timeAgo: "1 วันที่แล้ว", read: false },
  { id: "N007", type: "system", title: "สำรองข้อมูลอัตโนมัติ", description: "สำรองข้อมูลรายสัปดาห์เสร็จ ขนาด 142 MB", timeAgo: "1 วันที่แล้ว", read: true },
  { id: "N008", type: "duplicate", title: "พบใบเสร็จซ้ำจากแม็คโคร", description: "ใบเสร็จ 3,820.50 บาท คล้ายกัน 3 รายการ", timeAgo: "2 วันที่แล้ว", read: true },
];

export default function NotificationsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const clearDemo = () => setNotifications([]);
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const toggleRead = (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "unread", label: "ยังไม่อ่าน" },
    { key: "budget", label: "งบประมาณ" },
    { key: "bill", label: "บิล" },
    { key: "system", label: "ระบบ" },
  ];

  const typeConfig: Record<NotifType, { icon: typeof Bell; color: string; bg: string }> = {
    budget: { icon: AlertTriangle, color: "text-amber-500", bg: isDark ? "bg-amber-500/10" : "bg-amber-50" },
    bill: { icon: Receipt, color: "text-blue-500", bg: isDark ? "bg-blue-500/10" : "bg-blue-50" },
    duplicate: { icon: Copy, color: "text-orange-500", bg: isDark ? "bg-orange-500/10" : "bg-orange-50" },
    system: { icon: Settings, color: "text-gray-500", bg: isDark ? "bg-gray-500/10" : "bg-gray-100" },
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    return n.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const cardCls = isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200";
  const tp = isDark ? "text-white" : "text-gray-900";
  const ts = isDark ? "text-gray-400" : "text-gray-500";
  const tm = isDark ? "text-gray-500" : "text-gray-400";
  const btnCls = isDark ? "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-gray-300 hover:bg-[rgba(255,255,255,0.08)]" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50";

  return (
    <div className="space-y-6">
      <PageHeader title="การแจ้งเตือน" description="แจ้งเตือนงบประมาณ บิล และระบบ" onClear={clearDemo} />

      <div className={"flex gap-1 p-1 rounded-xl " + (isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-gray-100")}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={"flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (
              activeTab === tab.key
                ? (isDark ? "bg-[rgba(255,255,255,0.1)] text-white" : "bg-white text-gray-900 shadow-sm")
                : (isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900")
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={"rounded-2xl border p-12 text-center " + cardCls}>
          <p className={tm}>ไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const cfg = typeConfig[notif.type];
            const TypeIcon = cfg.icon;
            return (
              <div
                key={notif.id}
                onClick={() => toggleRead(notif.id)}
                className={"rounded-2xl border p-4 flex items-start gap-4 cursor-pointer transition-colors " + cardCls + (!notif.read ? " border-l-4 border-l-rose-500" : "")}
              >
                <div className={"w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 " + cfg.bg}>
                  <TypeIcon className={"w-5 h-5 " + cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={"font-medium " + tp + (!notif.read ? " font-semibold" : "")}>{notif.title}</p>
                    {!notif.read && <Circle className="w-2 h-2 fill-rose-500 text-rose-500 flex-shrink-0" />}
                  </div>
                  <p className={"text-sm mt-0.5 " + ts}>{notif.description}</p>
                  <p className={"text-xs mt-1 " + tm}>{notif.timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
