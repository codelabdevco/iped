"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/", label: "หน้าหลัก", icon: "🏠" },
  { href: "/history", label: "ประวัติ", icon: "📋" },
];

const ADMIN_NAV = { href: "/admin", label: "แอดมิน", icon: "⚙️" };

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, isAdmin, login, logout, loading } = useAuth();

  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_NAV] : NAV_ITEMS;

  return (
    <nav className="bg-black sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo-cropped.png" alt="iPED" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-bold text-lg text-white tracking-tight">iPED</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm ${
                    pathname === item.href
                      ? "bg-yellow-400 text-black hover:bg-yellow-300 hover:text-black"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Button>
              </Link>
            ))}

            <div className="w-px h-6 bg-gray-700 mx-2" />

            {loading ? (
              <div className="w-20 h-8 bg-gray-800 rounded animate-pulse" />
            ) : isLoggedIn ? (
              <div className="flex items-center gap-2">
                {user?.pictureUrl ? (
                  <img src={user.pictureUrl} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-black">
                    {user?.displayName?.[0] || "U"}
                  </div>
                )}
                <span className="text-sm text-gray-300 hidden sm:inline max-w-[100px] truncate">
                  {user?.displayName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800 text-xs"
                  onClick={logout}
                >
                  ออก
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="bg-yellow-400 text-black hover:bg-yellow-300 font-medium text-sm"
                onClick={login}
              >
                เข้าสู่ระบบ
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
