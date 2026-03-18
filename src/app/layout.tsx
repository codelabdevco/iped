import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "iPED — ระบบจัดการใบเสร็จอัจฉริยภ",
  description: "อัปโหลดใบเสร็จ ระบบ AI อ่านและจัดเก็บให้อัตโนมัติ — iPED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('iped-theme') || 'dark';
              var d = document.documentElement;
              d.setAttribute('data-theme', t);
              d.style.cssText = 'background-color:' + (t === 'dark' ? '#0a0a0a' : '#f7f7f7') + ';color:' + (t === 'dark' ? '#fff' : '#111');
            } catch(e){}
          })();
        `}} />
      </head>
      <body className="min-h-screen antialiased" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
