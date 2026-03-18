import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) redirect("/login");
  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  return (
    <ThemeProvider>
      {/* Inline script to prevent theme flash on load */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('iped-theme')||'dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.backgroundColor=t==='dark'?'#0a0a0a':'#f7f7f7';document.documentElement.style.color=t==='dark'?'#fff':'#111'}catch(e){}})()` }} />
      {children}
    </ThemeProvider>
  );
}
