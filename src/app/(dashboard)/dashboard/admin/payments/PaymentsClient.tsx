"use client";

import { useState, useMemo, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Receipt, Clock, CheckCircle, XCircle, Search, CircleDollarSign,
  Eye, Check, X, Loader2, AlertTriangle, Image,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import Baht from "@/components/dashboard/Baht";

interface OrderRow {
  _id: string; userId: string; userName: string; userPic: string; userEmail: string;
  packageTier: string; packageName: string; billingCycle: string;
  amount: number; hasSlip: boolean; bankFrom: string;
  transferDate: string; transferTime: string; note: string;
  status: string; rejectedReason: string; createdAt: string;
}

interface Props {
  orders: OrderRow[];
  stats: { total: number; pending: number; approved: number; rejected: number; totalAmount: number };
}

const statusStyle: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  expired: "bg-gray-500/20 text-gray-400",
};
const statusLabel: Record<string, string> = {
  pending: "รอตรวจสอบ", approved: "อนุมัติแล้ว", rejected: "ปฏิเสธ", expired: "หมดอายุ",
};

function baht(n: number) { return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`; }

export default function PaymentsClient({ orders: initial, stats }: Props) {
  const { isDark } = useTheme();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [orders, setOrders] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Slip viewer
  const [viewSlipId, setViewSlipId] = useState<string | null>(null);
  const [slipImage, setSlipImage] = useState("");
  const [loadingSlip, setLoadingSlip] = useState(false);

  // Action
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);

  const filtered = useMemo(() => {
    let data = orders;
    if (statusFilter !== "all") data = data.filter(o => o.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(o => o.userName.toLowerCase().includes(q) || o.packageName.toLowerCase().includes(q));
    }
    return data;
  }, [orders, statusFilter, search]);

  const viewSlip = useCallback(async (id: string) => {
    setViewSlipId(id);
    setLoadingSlip(true);
    try {
      const res = await fetch(`/api/payment-orders/${id}`);
      const json = await res.json();
      setSlipImage(json.data?.slipImage || "");
    } catch {} finally { setLoadingSlip(false); }
  }, []);

  const handleAction = useCallback(async () => {
    if (!actionId || !actionType) return;
    setActing(true);
    try {
      const body = actionType === "approve"
        ? { action: "approve" }
        : { action: "reject", reason: rejectReason };
      const res = await fetch(`/api/payment-orders/${actionId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o._id === actionId ? { ...o, status: actionType === "approve" ? "approved" : "rejected", rejectedReason: rejectReason } : o));
        setActionId(null); setActionType(null); setRejectReason("");
      }
    } catch {} finally { setActing(false); }
  }, [actionId, actionType, rejectReason]);

  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");
  const panelBg = c("bg-[#0a0a0a] border-white/10", "bg-white border-gray-200");

  const columns: Column<OrderRow>[] = useMemo(() => [
    {
      key: "userName", label: "ผู้ชำระ",
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.userPic ? <img src={r.userPic} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" /> : <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${c("bg-white/10 text-white/50", "bg-gray-100 text-gray-500")}`}>{r.userName.charAt(0)}</div>}
          <div>
            <p className="font-medium text-sm">{r.userName}</p>
            {r.userEmail && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>{r.userEmail}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "packageName", label: "แพ็กเกจ",
      render: (r) => (
        <div>
          <span className={`text-sm font-medium ${c("text-white", "text-gray-900")}`}>{r.packageName}</span>
          <span className={`text-[10px] ml-1.5 ${c("text-white/30", "text-gray-400")}`}>{r.billingCycle === "yearly" ? "รายปี" : "รายเดือน"}</span>
        </div>
      ),
    },
    {
      key: "amount", label: "ยอดเงิน", align: "right",
      render: (r) => <span className="font-bold text-green-400">{baht(r.amount)}</span>,
    },
    {
      key: "bankFrom", label: "โอนจาก",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{r.bankFrom || "-"}</span>,
    },
    {
      key: "createdAt", label: "วันที่แจ้ง",
      render: (r) => r.createdAt ? (
        <div>
          <span className={`text-xs ${c("text-white/60", "text-gray-600")}`}>{new Date(r.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</span>
          <span className={`text-[10px] ml-1 ${c("text-white/30", "text-gray-400")}`}>{new Date(r.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      ) : <span className={c("text-white/30", "text-gray-400")}>-</span>,
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${statusStyle[r.status]}`}>{statusLabel[r.status]}</span>,
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {r.hasSlip && (
            <button onClick={() => viewSlip(r._id)} className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-blue-400", "hover:bg-gray-100 text-gray-400 hover:text-blue-500")}`} title="ดูสลิป"><Eye size={14} /></button>
          )}
          {r.status === "pending" && (
            <>
              <button onClick={() => { setActionId(r._id); setActionType("approve"); }} className={`px-2 py-1 rounded-lg text-[11px] font-medium ${c("bg-green-500/15 text-green-400 hover:bg-green-500/25", "bg-green-50 text-green-600 hover:bg-green-100")}`}><Check className="w-3 h-3 inline mr-0.5" />อนุมัติ</button>
              <button onClick={() => { setActionId(r._id); setActionType("reject"); setRejectReason(""); }} className={`px-2 py-1 rounded-lg text-[11px] font-medium ${c("bg-red-500/15 text-red-400 hover:bg-red-500/25", "bg-red-50 text-red-600 hover:bg-red-100")}`}><X className="w-3 h-3 inline mr-0.5" />ปฏิเสธ</button>
            </>
          )}
        </div>
      ),
    },
  ], [isDark, viewSlip]);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" }, { value: "pending", label: "รอตรวจสอบ" },
    { value: "approved", label: "อนุมัติแล้ว" }, { value: "rejected", label: "ปฏิเสธ" },
  ];

  return (
    <div className="space-y-6">
      {/* Slip viewer */}
      {viewSlipId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/80" onClick={() => { setViewSlipId(null); setSlipImage(""); }} />
          <div className="fixed inset-4 z-50 flex items-center justify-center">
            <div className={`max-w-lg max-h-[90vh] ${panelBg} border rounded-2xl shadow-2xl overflow-hidden`}>
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <h3 className={`text-sm font-bold ${c("text-white", "text-gray-900")}`}>สลิปโอนเงิน</h3>
                <button onClick={() => { setViewSlipId(null); setSlipImage(""); }} className={`p-1.5 rounded-lg ${c("hover:bg-white/5 text-white/40", "hover:bg-gray-100 text-gray-400")}`}><X size={16} /></button>
              </div>
              <div className="p-4 overflow-auto max-h-[75vh]">
                {loadingSlip ? <div className="flex justify-center py-12"><Loader2 size={24} className="text-[#FA3633] animate-spin" /></div>
                  : slipImage ? <img src={slipImage} alt="สลิป" className="w-full rounded-lg" />
                  : <p className={`text-center py-12 ${c("text-white/40", "text-gray-500")}`}>ไม่มีสลิป</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action modal */}
      {actionId && actionType && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => { setActionId(null); setActionType(null); }} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${actionType === "approve" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {actionType === "approve" ? <CheckCircle size={20} className="text-green-400" /> : <XCircle size={20} className="text-red-400" />}
                </div>
                <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>{actionType === "approve" ? "อนุมัติการชำระ" : "ปฏิเสธการชำระ"}</h2>
              </div>
              <p className={`text-sm ${c("text-white/60", "text-gray-600")}`}>
                {actionType === "approve"
                  ? "ระบบจะเปิดใช้แพ็กเกจให้ user ทันที"
                  : "กรุณาระบุเหตุผล"}
              </p>
              {actionType === "reject" && (
                <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="เหตุผลที่ปฏิเสธ เช่น สลิปไม่ชัด, ยอดไม่ตรง" className={`w-full h-9 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} autoFocus />
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={handleAction} disabled={acting} className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 flex items-center justify-center gap-2 ${actionType === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}>
                  {acting && <Loader2 size={14} className="animate-spin" />}{actionType === "approve" ? "ยืนยันอนุมัติ" : "ยืนยันปฏิเสธ"}
                </button>
                <button onClick={() => { setActionId(null); setActionType(null); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      <PageHeader title="รายการชำระเงิน" description="ตรวจสอบและอนุมัติการชำระเงินแพ็กเกจ" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ทั้งหมด" value={`${stats.total}`} icon={<Receipt size={20} />} color="text-blue-500" />
        <StatsCard label="รอตรวจสอบ" value={`${stats.pending}`} icon={<Clock size={20} />} color="text-yellow-500" />
        <StatsCard label="อนุมัติแล้ว" value={`${stats.approved}`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="รายได้รวม" value={baht(stats.totalAmount)} icon={<CircleDollarSign size={20} />} color="text-purple-500" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหาชื่อ, แพ็กเกจ..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        <div className="w-36"><Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} /></div>
      </div>

      <DataTable columns={columns} data={filtered} rowKey={r => r._id} emptyText="ยังไม่มีรายการชำระเงิน" columnConfigKey="admin-payments" dateField="createdAt" />
    </div>
  );
}
