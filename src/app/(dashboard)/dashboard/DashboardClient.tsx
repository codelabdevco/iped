"use client";

import { useTheme } from "@/contexts/ThemeContext";

interface DashboardData {
  totalAmount: number;
  receiptCount: number;
  avgPerReceipt: number;
  categoryCount: number;
  monthlyData: { month: string; amount: number }[];
  categoryData: { name: string; amount: number; color: string }[];
  recentReceipts: { id: string; store: string; type: string; category: string; amount: number; date: string; status: string }[];
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { isDark } = useTheme();
  const card = isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200 shadow-sm";
  const txt = isDark ? "text-white" : "text-gray-900";
  const txtSub = isDark ? "text-white/50" : "text-gray-500";
  const txtMuted = isDark ? "text-white/30" : "text-gray-400";
  const tableBorder = isDark ? "border-white/10" : "border-gray-200";
  const tableRowHover = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";

  const stats = [
    { label: "\u0e22\u0e2d\u0e14\u0e23\u0e27\u0e21\u0e40\u0e14\u0e37\u0e2d\u0e19\u0e19\u0e35\u0e49", value: `\u0e3f${data.totalAmount.toLocaleString()}`, change: "\u2197 0%", icon: "\ud83d\udcc8", color: "text-[#FA3633]" },
    { label: "\u0e08\u0e33\u0e19\u0e27\u0e19\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08", value: `${data.receiptCount} \u0e43\u0e1a`, change: "\u2197 0%", icon: "\ud83d\udcc4", color: "text-blue-400" },
    { label: "\u0e40\u0e09\u0e25\u0e35\u0e48\u0e22\u0e15\u0e48\u0e2d\u0e43\u0e1a", value: `\u0e3f${data.avgPerReceipt.toLocaleString()}`, icon: "\ud83d\udccb", color: "text-green-400" },
    { label: "\u0e2b\u0e21\u0e27\u0e14\u0e2b\u0e21\u0e39\u0e48", value: `${data.categoryCount} \u0e2b\u0e21\u0e27\u0e14`, icon: "\ud83d\udcc1", color: "text-purple-400" },
  ];

  const months = ["\u0e15.\u0e04.", "\u0e1e.\u0e22.", "\u0e18.\u0e04.", "\u0e21.\u0e04.", "\u0e01.\u0e1e.", "\u0e21\u0e35.\u0e04."];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${txt}`}>{"\u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21"}</h1>
        <p className={`text-sm ${txtSub}`}>{"\u0e2a\u0e23\u0e38\u0e1b\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22\u0e40\u0e14\u0e37\u0e2d\u0e19\u0e19\u0e35\u0e49"}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`${card} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-2xl p-2 rounded-lg ${isDark ? "bg-white/5" : "bg-gray-100"}`}>{s.icon}</span>
              {s.change && <span className="text-xs text-green-400">{s.change}</span>}
            </div>
            <div className={`text-2xl font-bold ${txt}`}>{s.value}</div>
            <div className={`text-sm ${txtSub}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 ${card} border rounded-xl p-5`}>
          <h3 className={`font-semibold mb-4 ${txt}`}>{"\u0e41\u0e19\u0e27\u0e42\u0e19\u0e49\u0e21\u0e23\u0e32\u0e22\u0e40\u0e14\u0e37\u0e2d\u0e19"}</h3>
          <div className="h-[200px] flex items-end gap-2">
            {months.map((m, i) => {
              const val = data.monthlyData[i]?.amount || 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <span className={`text-xs ${txtSub} mb-1`}>{"\u0e3f"}{val}</span>
                    <div className="w-full bg-[#FA3633]/20 rounded-t" style={{ height: Math.max(4, (val / Math.max(...data.monthlyData.map(d => d.amount), 1)) * 150) }}>
                      <div className="w-full h-full bg-[#FA3633] rounded-t opacity-80"></div>
                    </div>
                  </div>
                  <span className={`text-xs ${txtSub}`}>{m}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className={`${card} border rounded-xl p-5`}>
          <h3 className={`font-semibold mb-4 ${txt}`}>{"\u0e2a\u0e31\u0e14\u0e2a\u0e48\u0e27\u0e19\u0e2b\u0e21\u0e27\u0e14\u0e2b\u0e21\u0e39\u0e48"}</h3>
          {data.categoryData.length > 0 ? (
            <div className="space-y-3">
              {data.categoryData.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></div>
                  <span className={`text-sm flex-1 ${txt}`}>{c.name}</span>
                  <span className={`text-sm font-medium ${txt}`}>{"\u0e3f"}{c.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className={`text-sm ${txtMuted} text-center py-8`}>{"\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25"}</p>}
        </div>
      </div>

      {/* Recent Receipts Table */}
      <div className={`${card} border rounded-xl overflow-hidden`}>
        <div className="p-5 flex items-center justify-between">
          <h3 className={`font-semibold ${txt}`}>{"\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14"}</h3>
          <a href="/dashboard/receipts" className="text-sm text-[#FA3633] hover:underline">{"\u0e14\u0e39\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14"} &rarr;</a>
        </div>
        <table className="w-full">
          <thead>
            <tr className={`border-t ${tableBorder}`}>
              {["\u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32", "\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17", "\u0e2b\u0e21\u0e27\u0e14\u0e2b\u0e21\u0e39\u0e48", "\u0e08\u0e33\u0e19\u0e27\u0e19\u0e40\u0e07\u0e34\u0e19", "\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48", "\u0e2a\u0e16\u0e32\u0e19\u0e30"].map(h => (
                <th key={h} className={`px-5 py-3 text-left text-xs font-medium ${txtSub} uppercase`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.recentReceipts.length > 0 ? data.recentReceipts.slice(0, 5).map((r) => (
              <tr key={r.id} className={`border-t ${tableBorder} ${tableRowHover} transition-colors`}>
                <td className={`px-5 py-3 text-sm ${txt}`}>{r.store}</td>
                <td className={`px-5 py-3 text-sm ${txtSub}`}>{r.type}</td>
                <td className={`px-5 py-3 text-sm ${txtSub}`}>{r.category}</td>
                <td className={`px-5 py-3 text-sm font-medium ${txt}`}>{"\u0e3f"}{r.amount.toLocaleString()}</td>
                <td className={`px-5 py-3 text-sm ${txtSub}`}>{r.date}</td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">{r.status}</span></td>
              </tr>
            )) : (
              <tr><td colSpan={6} className={`px-5 py-12 text-center text-sm ${txtMuted}`}>{"\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08 \u2014 \u0e25\u0e2d\u0e07\u0e2a\u0e48\u0e07\u0e23\u0e39\u0e1b\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e1c\u0e48\u0e32\u0e19 LINE \u0e14\u0e39\u0e2a\u0e34!"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
