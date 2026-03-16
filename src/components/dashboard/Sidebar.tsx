"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FolderOpen,
  Wallet,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
  { label: "ใบเสร็จ", href: "/dashboard/receipts", icon: Receipt },
  { label: "หมวดหมู่", href: "/dashboard/categories", icon: FolderOpen },
  { label: "งบประมาณ", href: "/dashboard/budget", icon: Wallet },
  { label: "สรุปรายงาน", href: "/dashboard/summary", icon: BarChart3 },
  { label: "เอกสาร", href: "/dashboard/documents", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const handleLogout = () => {
    document.cookie = "auth-token=; path=/; max-age=0";
    window.location.href = "/login";
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-[260px]"
      } bg-[#111111] border-r border-white/5 flex flex-col transition-all duration-300`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FA3633] rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
            iP
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight">iPED</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[#FA3633]/10 text-[#FA3633]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="py-4 px-3 border-t border-white/5 space-y-1">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith("/dashboard/settings")
              ? "bg-[#FA3633]/10 text-[#FA3633]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Settings size={20} className="shrink-0" />
          {!collapsed && <span>ตั้งค่า</span>}
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-red-400 hover:bg-white/5 transition-colors w-full"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>ออกจากระบบ</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight size={20} className="shrink-0" />
          ) : (
            <>
              <ChevronLeft size={20} className="shrink-0" />
              <span>ย่อเมนู</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
