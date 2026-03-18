import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "อาซิ่ม — ระบบจัดการใบเสร็จอัจฉริยะ",
  description: "อัปโหลดใบเสร็จ ระบบ AI อ่านและจัดเก็บให้อัตโนมัติ — อาซิ่ม by codelabs tech",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "อาซิ่ม",
    startupImage: "/icon-512.png",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "อาซิ่ม — ระบบจัดการใบเสร็จอัจฉริยะ",
    description: "อัปโหลดใบเสร็จ ระบบ AI อ่านและจัดเก็บให้อัตโนมัติ — อาซิ่ม by codelabs tech",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7f7" },
  ],
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
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(){});
            });
          }
        `}} />
      </head>
      <body className="min-h-screen antialiased" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
