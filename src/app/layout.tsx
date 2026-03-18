import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "iPED — ระบบจัดการใบเสร็จอัจฉริยภ",
  description: "อัปโหลดใบเสร็จ ระบบ AI อ่านและจัดเก็บให้อัตโนมัติ — iPED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" data-theme="dark" style={{ backgroundColor: "#0a0a0a" }}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('iped-theme') || 'dark';
              document.documentElement.setAttribute('data-theme', t);
              document.documentElement.style.backgroundColor = t === 'dark' ? '#0a0a0a' : '#f7f7f7';
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
