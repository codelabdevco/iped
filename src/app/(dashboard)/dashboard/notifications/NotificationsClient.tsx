"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Bell, AlertTriangle, Receipt, Copy, Settings, Circle } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

type NotifType = "budget" | "bill" | "duplicate" | "system";
type FilterTab = "all" | "unread" | "budget" | "bill" | "system";

export interface NotificationItem {
  _id: string;
  type: NotifType;
  title: string;
  description: string;
  timeAgo: string;
  read: boolean;
}

interface Props {
  notifications: NotificationItem[];
}

export default function NotificationsClient({ notifications: initial }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [notifications, setNotifications] = useState<NotificationItem[]>(initial);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const toggleRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: !n.read } : n)));

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

  const cardCls = isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200";
  const tp = isDark ? "text-white" : "text-gray-900";
  const ts = isDark ? "text-gray-400" : "text-gray-500";
  const tm = isDark ? "text-gray-500" : "text-gray-400";

  return (
    <div className="space-y-6">
      <PageHeader title="การแจ้งเตือน" description="แจ้งเตือนงบประมาณ บิล และระบบ" />

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
                key={notif._id}
                onClick={() => toggleRead(notif._id)}
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
