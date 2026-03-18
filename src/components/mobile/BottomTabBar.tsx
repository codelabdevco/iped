"use client";

import { usePathname } from "next/navigation";
import { Home, Receipt, ScanLine, BarChart3, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const tabs = [
  { href: "/m", icon: Home, label: "หน้าหลัก" },
  { href: "/m/receipts", icon: Receipt, label: "ใบเสร็จ" },
  { href: "/m/scan", icon: ScanLine, label: "สแกน", center: true },
  { href: "/m/reports", icon: BarChart3, label: "สรุป" },
  { href: "/m/profile", icon: User, label: "โปรไฟล์" },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { isDark } = useTheme();

  const bg = isDark ? "bg-[#111]/95 border-white/10" : "bg-white/95 border-gray-200";
  const activeColor = "#FA3633";
  const inactiveColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 ${bg} border-t backdrop-blur-xl`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = tab.href === "/m" ? pathname === "/m" : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <a key={tab.href} href={tab.href} className="flex flex-col items-center -mt-5">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${isActive ? "bg-[#FA3633]" : isDark ? "bg-white/10" : "bg-gray-100"}`}>
                  <Icon size={24} className={isActive ? "text-white" : isDark ? "text-white/60" : "text-gray-500"} />
                </div>
                <span className={`text-[10px] mt-0.5 font-medium`} style={{ color: isActive ? activeColor : inactiveColor }}>{tab.label}</span>
              </a>
            );
          }

          return (
            <a key={tab.href} href={tab.href} className="flex flex-col items-center gap-0.5 py-2 px-3">
              <Icon size={22} style={{ color: isActive ? activeColor : inactiveColor }} />
              <span className="text-[10px] font-medium" style={{ color: isActive ? activeColor : inactiveColor }}>{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
