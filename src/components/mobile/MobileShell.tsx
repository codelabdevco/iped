"use client";

import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import BottomTabBar from "./BottomTabBar";

function MobileInner({ children, displayName, pictureUrl }: { children: React.ReactNode; displayName: string; pictureUrl?: string }) {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0a0a0a]" : "bg-gray-50"}`}>
      {/* Top bar */}
      <header className={`sticky top-0 z-40 flex items-center justify-between px-4 h-14 ${isDark ? "bg-[#0a0a0a]/95" : "bg-gray-50/95"} backdrop-blur-xl`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FA3633] flex items-center justify-center">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>iPED</span>
        </div>
        <a href="/m/profile">
          {pictureUrl ? (
            <img src={pictureUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className={`w-8 h-8 rounded-full ${isDark ? "bg-white/10" : "bg-gray-200"} flex items-center justify-center text-xs font-bold ${isDark ? "text-white/60" : "text-gray-500"}`}>
              {(displayName || "U")[0]}
            </div>
          )}
        </a>
      </header>

      {/* Content */}
      <main className="px-4 pb-24">
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}

export default function MobileShell({ children, displayName, pictureUrl }: { children: React.ReactNode; displayName: string; pictureUrl?: string }) {
  return (
    <ThemeProvider>
      <MobileInner displayName={displayName} pictureUrl={pictureUrl}>
        {children}
      </MobileInner>
    </ThemeProvider>
  );
}
