"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface AdminStats { totalUsers: number; newUsersToday: number; totalDocuments: number; docsToday: number; totalRevenue: number; revenueToday: number; ocrAccuracy: number; ocrErrors: number; }
interface AuditEntry { _id: string; action: string; category: string; userId: string; details: Record<string, unknown>; createdAt: string; }
interface UserEntry { _id: string; displayName: string; email?: string; role: string; status: string; lineUserId?: string; createdAt: string; }

const DEMO_STATS: AdminStats = { totalUsers: 1245, newUsersToday: 23, totalDocuments: 48302, docsToday: 156, totalRevenue: 12500000, revenueToday: 285000, ocrAccuracy: 98.5, ocrErrors: 3 };

export default function AdminPage() {
  const { isAdmin, isLoggedIn, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats>(DEMO_STATS);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [tab, setTab] = useState<"overview" | "users" | "logs" | "ocr">("overview");
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [bySource, setBySource] = useState<{ source: string; count: number; amount: number }[]>([]);
  const [dailyTrend, setDailyTrend] = useState<{ date: string; count: number; amount: number }[]>([]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/admin/overview").then((r) => r.json()).then((data) => {
      if (data.data) {
        const d = data.data;
        setStats({ totalUsers: d.users?.total || 0, newUsersToday: d.users?.newToday || 0, totalDocuments: d.documents?.total || 0, docsToday: d.documents?.today || 0, totalRevenue: d.revenue?.total || 0, revenueToday: d.revenue?.today || 0, ocrAccuracy: d.ocrAccuracy || 0, ocrErrors: d.ocrErrors || 0 });
        setBySource(d.bySource || []);
        setDailyTrend(d.dailyTrend || []);
      }
    }).catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    if (tab !== "users" || !isLoggedIn) return;
    setUsersLoading(true);
    fetch(`/api/admin/users?limit=50&search=${userSearch}`).then((r) => r.json()).then((data) => setUsers(data.data?.users || [])).finally(() => setUsersLoading(false));
  }, [tab, userSearch, isLoggedIn]);

  useEffect(() => {
    if (tab !== "logs" || !isLoggedIn) return;
    fetch("/api/admin/logs?limit=30").then((r) => r.json()).then((data) => setLogs(data.data?.logs || []));
  }, [tab, isLoggedIn]);

  const TABS = [
    { key: "overview" as const, label: "\u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21", icon: "\ud83d\udcca" },
    { key: "users" as const, label: "\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49", icon: "\ud83d\udc65" },
    { key: "logs" as const, label: "Logs", icon: "\ud83d\udcdd" },
    { key: "ocr" as const, label: "OCR", icon: "\ud83e\udd16" },
  ];
  const isDemoMode = !isLoggedIn && !authLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{"\u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21\u0e23\u0e30\u0e1a\u0e1a"} iPED</p>
          </div>
          <div className="flex items-center gap-2">
            {isDemoMode && <Badge variant="warning" className="text-xs">Demo Mode</Badge>}
            <Badge variant="success" className="text-sm px-3 py-1">{"\u0e23\u0e30\u0e1a\u0e1a\u0e1b\u0e01\u0e15\u0e34"} {"\u2713"}</Badge>
          </div>
        </div>
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {TABS.map((t) => (
            <Button key={t.key} variant={tab === t.key ? "default" : "ghost"} size="sm" onClick={() => setTab(t.key)} className="text-sm">
              <span className="mr-1">{t.icon}</span> {t.label}
            </Button>
          ))}
        </div>

        {tab === "overview" && (<>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="pt-5 pb-4 px-5"><p className="text-xs text-muted-foreground font-medium">Users</p><p className="text-2xl font-bold mt-1">{stats.totalUsers.toLocaleString()}</p><p className="text-xs text-green-600 mt-1">+{stats.newUsersToday}</p></CardContent></Card>
            <Card><CardContent className="pt-5 pb-4 px-5"><p className="text-xs text-muted-foreground font-medium">Documents</p><p className="text-2xl font-bold mt-1">{stats.totalDocuments.toLocaleString()}</p><p className="text-xs text-green-600 mt-1">+{stats.docsToday}</p></CardContent></Card>
            <Card><CardContent className="pt-5 pb-4 px-5"><p className="text-xs text-muted-foreground font-medium">Revenue</p><p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p><p className="text-xs text-muted-foreground mt-1">Today {formatCurrency(stats.revenueToday)}</p></CardContent></Card>
            <Card><CardContent className="pt-5 pb-4 px-5"><p className="text-xs text-muted-foreground font-medium">OCR Accuracy</p><p className="text-2xl font-bold mt-1">{stats.ocrAccuracy}%</p><p className="text-xs text-red-500 mt-1">{stats.ocrErrors} errors</p></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader className="pb-3"><CardTitle className="text-base">Data Sources</CardTitle></CardHeader><CardContent>{bySource.length > 0 ? (<div className="space-y-3">{bySource.map((s) => (<div key={s.source} className="flex items-center justify-between py-2 border-b last:border-0"><div className="flex items-center gap-2"><Badge variant="secondary">{s.source}</Badge><span className="text-sm text-muted-foreground">{s.count} items</span></div><span className="font-medium">{formatCurrency(s.amount)}</span></div>))}</div>) : (<p className="text-sm text-muted-foreground py-4 text-center">No data</p>)}</CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-base">7 Day Trend</CardTitle></CardHeader><CardContent>{dailyTrend.length > 0 ? (<div className="space-y-2">{dailyTrend.slice(-7).map((d) => { const max = Math.max(...dailyTrend.map((t) => t.amount), 1); const pct = Math.round((d.amount / max) * 100); return (<div key={d.date} className="flex items-center gap-3"><span className="text-xs text-muted-foreground w-20">{d.date.slice(5)}</span><div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden"><div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} /></div><span className="text-xs font-medium w-24 text-right">{formatCurrency(d.amount)}</span></div>); })}</div>) : (<p className="text-sm text-muted-foreground py-4 text-center">No data</p>)}</CardContent></Card>
          </div>
        </>)}

        {tab === "users" && (
          <Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Users</CardTitle><Input placeholder="Search..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="max-w-xs" /></div></CardHeader><CardContent>
            {usersLoading ? (<p className="text-center text-muted-foreground py-8">Loading...</p>) : users.length > 0 ? (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="pb-2 font-medium text-muted-foreground">Name</th><th className="pb-2 font-medium text-muted-foreground">Email</th><th className="pb-2 font-medium text-muted-foreground">Role</th><th className="pb-2 font-medium text-muted-foreground">Status</th><th className="pb-2 font-medium text-muted-foreground">LINE</th><th className="pb-2 font-medium text-muted-foreground">Joined</th></tr></thead>
              <tbody>{users.map((u) => (<tr key={u._id} className="border-b last:border-0 hover:bg-gray-50"><td className="py-2.5 font-medium">{u.displayName}</td><td className="py-2.5 text-muted-foreground">{u.email || "-"}</td><td className="py-2.5"><Badge variant={u.role === "admin" || u.role === "superadmin" ? "default" : "secondary"}>{u.role}</Badge></td><td className="py-2.5"><Badge variant={u.status === "active" ? "success" : "warning"}>{u.status}</Badge></td><td className="py-2.5">{u.lineUserId ? "\u2705" : "\u2014"}</td><td className="py-2.5 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("th-TH")}</td></tr>))}</tbody></table></div>
            ) : (<p className="text-center text-muted-foreground py-8">No users found</p>)}
          </CardContent></Card>
        )}

        {tab === "logs" && (
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Audit Logs</CardTitle></CardHeader><CardContent>
            {logs.length > 0 ? (<div className="space-y-2">{logs.map((log) => (<div key={log._id} className="flex items-start gap-3 py-2 border-b last:border-0"><Badge variant="secondary" className="text-[10px] mt-0.5">{log.category}</Badge><div className="flex-1"><p className="text-sm text-gray-700">{log.action}</p><p className="text-xs text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString("th-TH")}</p></div></div>))}</div>) : (<p className="text-center text-muted-foreground py-8">No logs</p>)}
          </CardContent></Card>
        )}

        {tab === "ocr" && (
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">OCR Errors & Quality</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg text-center"><p className="text-2xl font-bold text-green-700">{stats.ocrAccuracy}%</p><p className="text-xs text-green-600 mt-1">Accuracy</p></div>
              <div className="p-4 bg-red-50 rounded-lg text-center"><p className="text-2xl font-bold text-red-700">{stats.ocrErrors}</p><p className="text-xs text-red-600 mt-1">Errors</p></div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center"><p className="text-2xl font-bold text-yellow-700">{stats.totalDocuments}</p><p className="text-xs text-yellow-600 mt-1">Total Scanned</p></div>
            </div>
            <p className="text-sm text-muted-foreground text-center py-4">OCR error details will show when real data is available</p>
          </CardContent></Card>
        )}
      </main>
    </div>
  );
}
