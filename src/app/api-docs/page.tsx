import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Documentation — iPED",
  description: "iPED API endpoint reference for developers",
};

/* ─── endpoint data ─── */

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  desc: string;
  auth?: boolean;
  admin?: boolean;
}

interface Section {
  title: string;
  endpoints: Endpoint[];
}

const sections: Section[] = [
  {
    title: "Authentication",
    endpoints: [
      { method: "GET", path: "/api/auth/line/login", desc: "Redirect to LINE OAuth" },
      { method: "GET", path: "/api/auth/line/callback", desc: "LINE OAuth callback" },
      { method: "POST", path: "/api/auth/line/liff", desc: "LIFF auto-login" },
      { method: "POST", path: "/api/auth/refresh", desc: "Refresh JWT token" },
    ],
  },
  {
    title: "Receipts",
    endpoints: [
      { method: "GET", path: "/api/receipts", desc: "List receipts (paginated)", auth: true },
      { method: "POST", path: "/api/receipts", desc: "Create receipt", auth: true },
      { method: "GET", path: "/api/receipts/[id]", desc: "Get single receipt", auth: true },
      { method: "PUT", path: "/api/receipts/[id]", desc: "Update receipt", auth: true },
      { method: "DELETE", path: "/api/receipts/[id]", desc: "Delete receipt", auth: true },
      { method: "POST", path: "/api/receipts/[id]/transfer", desc: "Transfer to business", auth: true },
      { method: "POST", path: "/api/receipts/[id]/reimburse", desc: "Approve/pay/reject reimbursement", auth: true },
      { method: "GET", path: "/api/receipts/image?id=", desc: "Get receipt image", auth: true },
      { method: "GET", path: "/api/receipts/poll", desc: "Poll for changes", auth: true },
    ],
  },
  {
    title: "OCR",
    endpoints: [
      { method: "POST", path: "/api/ocr", desc: "Upload + OCR scan image", auth: true },
    ],
  },
  {
    title: "Employees & Payroll",
    endpoints: [
      { method: "GET", path: "/api/employees", desc: "List employees", auth: true },
      { method: "POST", path: "/api/employees", desc: "Create employee", auth: true },
      { method: "PUT", path: "/api/employees/[id]", desc: "Update employee", auth: true },
      { method: "DELETE", path: "/api/employees/[id]", desc: "Delete employee", auth: true },
      { method: "GET", path: "/api/payroll", desc: "List payroll records", auth: true },
      { method: "POST", path: "/api/payroll/run", desc: "Generate monthly payroll", auth: true },
      { method: "PUT", path: "/api/payroll/[id]", desc: "Update/approve payroll", auth: true },
    ],
  },
  {
    title: "Subscription",
    endpoints: [
      { method: "GET", path: "/api/packages", desc: "List all packages (public)" },
      { method: "GET", path: "/api/subscription", desc: "Current user subscription", auth: true },
      { method: "POST", path: "/api/packages/seed", desc: "Seed packages (admin)", auth: true },
    ],
  },
  {
    title: "Admin",
    endpoints: [
      { method: "GET", path: "/api/admin/users", desc: "List all users", auth: true, admin: true },
      { method: "POST", path: "/api/admin/users", desc: "Create user", auth: true, admin: true },
      { method: "PUT", path: "/api/admin/users/[id]", desc: "Update user", auth: true, admin: true },
      { method: "DELETE", path: "/api/admin/users/[id]", desc: "Delete user + data", auth: true, admin: true },
      { method: "GET", path: "/api/admin/subscriptions", desc: "List subscriptions", auth: true, admin: true },
      { method: "PUT", path: "/api/admin/subscriptions", desc: "Change user package", auth: true, admin: true },
    ],
  },
  {
    title: "System",
    endpoints: [
      { method: "GET", path: "/api/health", desc: "Health check (public)" },
      { method: "GET", path: "/api/cron/daily-summary", desc: "Daily summary cron" },
      { method: "GET", path: "/api/cron/reset-usage", desc: "Reset usage cron" },
    ],
  },
];

/* ─── helpers ─── */

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

/* ─── page ─── */

export default function ApiDocsPage() {
  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white"
      style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}
    >
      {/* Nav */}
      <nav className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-[#FA3633]">อา</span>ซิ่ม
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.12] transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            API Documentation
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-400 sm:text-lg">
            Reference for all iPED API endpoints. Authenticated endpoints require a valid JWT
            token in the <code className="rounded bg-white/[0.08] px-1.5 py-0.5 text-sm font-mono text-neutral-300">iped-token</code> cookie.
          </p>
        </div>

        {/* Legend */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm">
          {Object.entries(methodColors).map(([method, cls]) => (
            <span
              key={method}
              className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${cls}`}
            >
              {method}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-neutral-400">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            Auth required
          </span>
          <span className="inline-flex items-center gap-1.5 text-neutral-400">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            Admin only
          </span>
        </div>

        {/* Sections */}
        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 text-xl font-semibold text-white border-b border-white/[0.06] pb-3">
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.endpoints.map((ep, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Method badge */}
                    <span
                      className={`inline-flex w-fit items-center rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${
                        methodColors[ep.method]
                      }`}
                    >
                      {ep.method}
                    </span>

                    {/* Path */}
                    <code className="font-mono text-sm text-neutral-200 shrink-0">
                      {ep.path}
                    </code>

                    {/* Description */}
                    <span className="text-sm text-neutral-400 sm:ml-auto sm:text-right">
                      {ep.desc}
                    </span>

                    {/* Badges */}
                    <div className="flex gap-2 shrink-0">
                      {ep.auth && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
                          Auth
                        </span>
                      )}
                      {ep.admin && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-400 border border-red-500/20">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 border-t border-white/[0.06] pt-8 text-center">
          <p className="text-sm text-neutral-500">
            Powered by{" "}
            <span className="font-medium text-neutral-400">codelabs tech</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
