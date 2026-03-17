"use client";

import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

function ShellInner({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? "bg-[#0a0a0a] text-white" : "bg-gray-50 text-gray-900"}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header displayName={displayName} pictureUrl="" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardShell({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner displayName={displayName}>{children}</ShellInner>
    </ThemeProvider>
  );
}
