"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FolderOpen,
  PiggyBank,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { label: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
  { label: "ใบเสร็จ", href: "/dashboard/receipts", icon: Receipt },
  { label: "หมวดหมู่", href: "/dashboard/categories", icon: FolderOpen },
  { label: "งบประมาณ", href: "/dashboard/budget", icon: PiggyBank },
  { label: "สรุปรายงาน", href: "/dashboard/reports", icon: BarChart3 },
  { label: "เอกสาร", href: "/dashboard/documents", icon: FileText },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const handleLogout = async () => {
    document.cookie = "iped-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const bg = isDark
    ? "bg-[#111111] border-[rgba(255,255,255,0.06)]"
    : "bg-white border-gray-200";
  const txt = isDark
    ? "text-white/60 hover:text-white hover:bg-[rgba(255,255,255,0.03)]"
    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100";
  const activeCls = "bg-[#FA3633]/10 text-[#FA3633]";
  const borderCls = isDark ? "border-[rgba(255,255,255,0.04)]" : "border-gray-200";

  return (
    <aside
      className={`${bg} border-r flex flex-col overflow-hidden`}
      style={{
        width: collapsed ? 70 : 240,
        minWidth: collapsed ? 70 : 240,
        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1), min-width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Logo */}
      <div className={`h-16 flex items-center px-4 border-b ${borderCls} overflow-hidden`}>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <div className="w-8 h-8 bg-[#FA3633] rounded-lg flex items-center justify-center font-bold text-sm shrink-0 text-white">
            iP
          </div>
          <span
            className="text-lg font-semibold tracking-tight"
            style={{
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? "translateX(-8px)" : "translateX(0)",
              transition: "opacity 200ms ease, transform 200ms ease",
              pointerEvents: collapsed ? "none" : "auto",
            }}
          >
            iPED
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap overflow-hidden ${
                active ? activeCls : txt
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              <span
                style={{
                  opacity: collapsed ? 0 : 1,
                  transform: collapsed ? "translateX(-8px)" : "translateX(0)",
                  transition: "opacity 200ms ease, transform 200ms ease",
                  pointerEvents: collapsed ? "none" : "auto",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`py-4 px-3 border-t ${borderCls} space-y-1 overflow-hidden`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${txt} w-full whitespace-nowrap overflow-hidden`}
          title={collapsed ? (isDark ? "Light Mode" : "Dark Mode") : undefined}
        >
          {isDark ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
          <span
            style={{
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? "translateX(-8px)" : "translateX(0)",
              transition: "opacity 200ms ease, transform 200ms ease",
              pointerEvents: collapsed ? "none" : "auto",
            }}
          >
            {isDark ? "โหมดสว่าง" : "โหมดมืด"}
          </span>
        </button>

        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap overflow-hidden ${
            pathname.startsWith("/dashboard/settings") ? activeCls : txt
          }`}
        >
          <Settings size={20} className="shrink-0" />
          <span
            style={{
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? "translateX(-8px)" : "translateX(0)",
              transition: "opacity 200ms ease, transform 200ms ease",
              pointerEvents: collapsed ? "none" : "auto",
            }}
          >
            ตั้งค่า
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
            isDark
              ? "text-white/60 hover:text-red-400 hover:bg-[rgba(255,255,255,0.03)]"
              : "text-gray-500 hover:text-red-500 hover:bg-gray-100"
          } transition-colors w-full whitespace-nowrap overflow-hidden`}
        >
          <LogOut size={20} className="shrink-0" />
          <span
            style={{
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? "translateX(-8px)" : "translateX(0)",
              transition: "opacity 200ms ease, transform 200ms ease",
              pointerEvents: collapsed ? "none" : "auto",
            }}
          >
            ออกจากระบบ
          </span>
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${txt} w-full whitespace-nowrap overflow-hidden`}
        >
          <div className="shrink-0 transition-transform duration-300" style={{ transform: collapsed ? "rotate(0deg)" : "rotate(0deg)" }}>
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </div>
          <span
            style={{
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? "translateX(-8px)" : "translateX(0)",
              transition: "opacity 200ms ease, transform 200ms ease",
              pointerEvents: collapsed ? "none" : "auto",
            }}
          >
            ย่อเมนู
          </span>
        </button>
      </div>
    </aside>
  );
}
