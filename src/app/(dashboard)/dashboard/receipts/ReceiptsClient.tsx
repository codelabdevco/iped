"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Receipt, FileText, CheckCircle, Clock, Pencil, Trash2, ImageIcon, Cloud, CloudOff, HardDrive, Upload, X, MessageCircle, Globe, User, Plus, Loader2 } from "lucide-react";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
import TimePicker from "@/components/dashboard/TimePicker";
import FileAttachments, { Attachment } from "@/components/dashboard/FileAttachments";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface LineItem {
  name: string;
  qty: number;
  price: number;
}

interface ReceiptRow {
  _id: string;
  storeName: string;
  amount: number;
  category: string;
  date: string;
  rawDate?: string;
  time?: string;
  status: string;
  type: string;
  source: string;
  imageUrl?: string;
  hasImage?: boolean;
  items?: LineItem[];
  paymentMethod?: string;
  note?: string;
  vat?: number;
  wht?: number;
  documentNumber?: string;
  merchantTaxId?: string;
  ocrConfidence?: number | null;
  itemCount?: number;
  updatedAt?: string;
  createdAt?: string;
  submittedBy?: string;
  savingsAmount?: string;
  savingsGoal?: string;
  direction?: string;
}

const statusStyle: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  confirmed: "bg-green-500/10 text-green-400",
  edited: "bg-blue-500/10 text-blue-400",
  paid: "bg-emerald-500/10 text-emerald-400",
  overdue: "bg-red-500/10 text-red-400",
  matched: "bg-cyan-500/10 text-cyan-400",
  cancelled: "bg-gray-500/10 text-gray-400",
  duplicate: "bg-orange-500/10 text-orange-400",
};
const statusLabel: Record<string, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันแล้ว",
  edited: "แก้ไขแล้ว",
  paid: "ชำระแล้ว",
  overdue: "เกินกำหนด",
  matched: "จับคู่แล้ว",
  cancelled: "ยกเลิก",
  duplicate: "สลิปซ้ำ",
};
const STATUS_DOTS: Record<string, string> = {
  pending: "#eab308", confirmed: "#22c55e", edited: "#3b82f6", paid: "#10b981", overdue: "#ef4444", matched: "#06b6d4", cancelled: "#6b7280", duplicate: "#f97316",
};
const STATUS_OPTIONS = Object.entries(statusLabel).map(([k, v]) => ({ value: k, label: v, dot: STATUS_DOTS[k] }));
const CATEGORY_COLORS: Record<string, string> = {
  "อาหาร": "#FB923C", "เดินทาง": "#60A5FA", "ช็อปปิ้ง": "#818CF8",
  "สาธารณูปโภค": "#F472B6", "ของใช้ในบ้าน": "#C084FC", "สุขภาพ": "#34D399",
  "การศึกษา": "#FBBF24", "บันเทิง": "#F87171", "ที่พัก": "#A78BFA",
  "คมนาคม": "#38BDF8", "ธุรกิจ": "#F59E0B", "อื่นๆ": "#78716C", "ไม่ระบุ": "#9CA3AF",
};
const FALLBACK_COLORS = ["#818CF8","#FB923C","#60A5FA","#F472B6","#C084FC","#34D399","#FBBF24","#F87171"];

const PAYMENT_METHODS = [
  { value: "cash", label: "เงินสด" },
  { value: "promptpay", label: "พร้อมเพย์" },
  { value: "credit", label: "บัตรเครดิต" },
  { value: "debit", label: "บัตรเดบิต" },
  { value: "transfer", label: "โอนธนาคาร" },
  { value: "bank-scb", label: "SCB ไทยพาณิชย์" },
  { value: "bank-kbank", label: "KBank กสิกรไทย" },
  { value: "bank-bbl", label: "BBL กรุงเทพ" },
  { value: "bank-ktb", label: "KTB กรุงไทย" },
  { value: "bank-tmb", label: "TTB ทีเอ็มบีธนชาต" },
  { value: "bank-bay", label: "BAY กรุงศรีอยุธยา" },
  { value: "bank-gsb", label: "GSB ออมสิน" },
  { value: "bank-ghb", label: "GHB อาคารสงเคราะห์" },
  { value: "bank-baac", label: "ธ.ก.ส." },
  { value: "bank-tisco", label: "TISCO ทิสโก้" },
  { value: "bank-kk", label: "KKP เกียรตินาคินภัทร" },
  { value: "bank-lhbank", label: "LH Bank แลนด์แอนด์เฮ้าส์" },
  { value: "bank-cimb", label: "CIMB ซีไอเอ็มบี" },
  { value: "bank-uob", label: "UOB ยูโอบี" },
  { value: "bank-icbc", label: "ICBC ไอซีบีซี" },
  { value: "ewallet-truemoney", label: "TrueMoney Wallet" },
  { value: "ewallet-rabbit", label: "Rabbit LINE Pay" },
  { value: "ewallet-shopee", label: "ShopeePay" },
  { value: "other", label: "อื่นๆ" },
];
/** Lazy-load receipt image thumbnail */
function LazyImage({ id, hasImage, onClickFull, isDark }: { id: string; hasImage?: boolean; onClickFull: (url: string) => void; isDark: boolean }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasImage || loaded) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loaded && !loading) {
        setLoading(true);
        fetch(`/api/receipts/image?id=${id}`)
          .then((r) => r.json())
          .then((d) => { if (d.imageUrl) setSrc(d.imageUrl); })
          .catch(() => {})
          .finally(() => { setLoaded(true); setLoading(false); });
        obs.disconnect();
      }
    }, { rootMargin: "100px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [id, hasImage, loaded, loading]);

  const muted = isDark ? "text-white/30" : "text-gray-400";
  return (
    <div
      ref={ref}
      className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${src ? "cursor-pointer hover:ring-2 hover:ring-[#FA3633]/50 transition-all" : ""} ${isDark ? "bg-white/5" : "bg-gray-100"}`}
      onClick={src ? (e) => { e.stopPropagation(); onClickFull(src); } : undefined}
    >
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={16} className={muted} />}
    </div>
  );
}

/** Format currency with .00 in smaller muted style */
function Baht({ value, className = "" }: { value: number; className?: string }) {
  const abs = Math.abs(value);
  const whole = Math.floor(abs).toLocaleString();
  const dec = (abs % 1).toFixed(2).slice(1); // ".00" or ".50"
  const sign = value < 0 ? "-" : "";
  return (
    <span className={className}>
      {sign}฿{whole}<span className="text-[0.75em] opacity-50">{dec}</span>
    </span>
  );
}

function getCatColor(cat: string): string {
  if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
  const idx = cat.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[idx];
}

const typeLabel: Record<string, string> = {
  receipt: "ใบเสร็จ",
  invoice: "ใบแจ้งหนี้",
  billing: "บิลเรียกเก็บ",
  debit_note: "ใบเพิ่มหนี้",
  credit_note: "ใบลดหนี้",
  income: "รายรับ",
  expense: "รายจ่าย",
};

export default function ReceiptsClient({ receipts: initialReceipts }: { receipts: ReceiptRow[] }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [receipts, setReceipts] = useState(initialReceipts);
  const pollRef = useRef<{ count: number; latestId: string | null }>({
    count: initialReceipts.length,
    latestId: initialReceipts[0]?._id || null,
  });

  // Sync when server re-renders with new data — only if actually changed
  const prevIdsRef = useRef("");
  useEffect(() => {
    const newIds = initialReceipts.map((r) => r._id + r.status + r.amount).join(",");
    if (newIds === prevIdsRef.current) return; // no change, skip re-render
    prevIdsRef.current = newIds;
    setReceipts(initialReceipts);
    pollRef.current = {
      count: initialReceipts.length,
      latestId: initialReceipts[0]?._id || null,
    };
  }, [initialReceipts]);

  // Poll for changes every 5s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/receipts/poll");
        if (!res.ok) return;
        const data = await res.json();
        const prev = pollRef.current;
        if (data.count !== prev.count || data.latestId !== prev.latestId) {
          pollRef.current = { count: data.count, latestId: data.latestId };
          router.refresh();
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [driveFilter, setDriveFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ReceiptRow>>({});
  const [editItems, setEditItems] = useState<LineItem[]>([]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [whtEnabled, setWhtEnabled] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipDragging, setSlipDragging] = useState(false);
  const slipInputRef = useRef<HTMLInputElement>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch = !search || r.storeName.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchType = typeFilter === "all" || r.type === typeFilter;
      const matchDrive = driveFilter === "all" || (driveFilter === "uploaded" ? (r.hasImage || r.imageUrl) : !(r.hasImage || r.imageUrl));
      return matchSearch && matchStatus && matchType && matchDrive;
    });
  }, [receipts, search, statusFilter, typeFilter, driveFilter]);

  const confirmedReceipts = filtered.filter((r) => r.status === "confirmed");
  const totalAmount = confirmedReceipts.reduce((s, r) => s + r.amount, 0);
  const confirmed = confirmedReceipts.length;
  const pending = filtered.filter((r) => r.status === "pending").length;

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const txt = isDark ? "text-white" : "text-gray-900";
  const inputCls = isDark
    ? "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-white placeholder-white/30"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400";

  const handleDelete = useCallback((id: string) => {
    if (confirm("ต้องการลบใบเสร็จนี้?")) {
      setReceipts((prev) => prev.filter((r) => r._id !== id));
    }
  }, []);

  const handleEdit = (r: ReceiptRow) => {
    setEditingId(r._id);
    setEditForm({
      storeName: r.storeName,
      amount: r.amount,
      category: r.category,
      status: r.status,
      type: r.type,
      date: r.rawDate || r.date,
      time: r.time || "",
      paymentMethod: r.paymentMethod || "",
      note: r.note || "",
      documentNumber: r.documentNumber || "",
      merchantTaxId: r.merchantTaxId || "",
    });
    setEditItems(r.items && r.items.length > 0 ? [...r.items] : [{ name: r.storeName, qty: 1, price: r.amount }]);
    setVatEnabled((r.vat || 0) > 0);
    setWhtEnabled((r.wht || 0) > 0);
    setTxType((r.direction === "income" ? "income" : r.direction === "savings" ? "savings" : "expense") as any);
    setAttachments([]);
    // Load image lazily for edit panel
    if (r.imageUrl) {
      setSlipPreview(r.imageUrl);
    } else if (r.hasImage) {
      setSlipPreview(null);
      fetch(`/api/receipts/image?id=${r._id}`)
        .then((res) => res.json())
        .then((d) => { if (d.imageUrl) setSlipPreview(d.imageUrl); })
        .catch(() => {});
    } else {
      setSlipPreview(null);
    }
  };

  const handleSlipUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setSlipPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSlipInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSlipUpload(file);
    if (slipInputRef.current) slipInputRef.current.value = "";
  };

  const handleSlipDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setSlipDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSlipUpload(file);
  };

  const handleSlipRemove = () => {
    setSlipPreview(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const itemsTotal = editItems.reduce((s, it) => s + it.qty * it.price, 0);
    const vat = vatEnabled ? Math.round(itemsTotal * 0.07) : 0;
    const wht = whtEnabled ? Math.round(itemsTotal * 0.03) : 0;
    const total = itemsTotal + vat - wht;
    try {
      await fetch(`/api/receipts/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: editForm.storeName,
          amount: total,
          date: editForm.date,
          time: editForm.time,
          category: editForm.category,
          type: editForm.type,
          status: editForm.status,
          paymentMethod: editForm.paymentMethod,
          note: editForm.note,
          documentNumber: editForm.documentNumber,
          merchantTaxId: editForm.merchantTaxId,
          vat: vat || undefined,
          wht: wht || undefined,
          imageUrl: slipPreview || undefined,
          items: editItems,
          direction: txType === "income" ? "income" : (txType as string) === "savings" ? "savings" : "expense",
        }),
      });
      setReceipts((prev) => prev.map((r) => r._id === editingId ? {
        ...r,
        ...editForm,
        amount: total,
        vat,
        wht,
        items: editItems,
        itemCount: editItems.length,
        imageUrl: slipPreview || r.imageUrl,
        direction: txType === "income" ? "income" : (txType as string) === "savings" ? "savings" : "expense",
      } : r));
      setEditingId(null);
      setEditForm({});
      setEditItems([]);
      setSlipPreview(null);
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setEditForm({});
  };

  const handleAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setEditForm({
      storeName: "",
      category: "ไม่ระบุ",
      status: "pending",
      type: "receipt",
      paymentMethod: "cash",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }),
      note: "",
      documentNumber: "",
      merchantTaxId: "",
    });
    setEditItems([{ name: "", qty: 1, price: 0 }]);
    setVatEnabled(false);
    setWhtEnabled(false);
    setTxType("expense");
    setAttachments([]);
    setSlipPreview(null);
  };

  const handleSaveAdd = async () => {
    if (!editForm.storeName) return;
    setSaving(true);
    const itemsTotal = editItems.reduce((s, it) => s + it.qty * it.price, 0);
    const vat = vatEnabled ? Math.round(itemsTotal * 0.07) : 0;
    const wht = whtEnabled ? Math.round(itemsTotal * 0.03) : 0;
    const total = itemsTotal + vat - wht;
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: editForm.storeName,
          date: editForm.date || new Date().toISOString().slice(0, 10),
          amount: total,
          vat: vat || undefined,
          wht: wht || undefined,
          category: editForm.category || "ไม่ระบุ",
          categoryIcon: "📋",
          type: editForm.type || "receipt",
          paymentMethod: editForm.paymentMethod || "cash",
          status: "pending",
          note: editForm.note || undefined,
          documentNumber: editForm.documentNumber || undefined,
          merchantTaxId: editForm.merchantTaxId || undefined,
          imageUrl: slipPreview || undefined,
          source: "web",
          direction: txType === "income" ? "income" : (txType as string) === "savings" ? "savings" : "expense",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const now = new Date().toISOString();
        // Add to local state immediately
        const newReceipt: ReceiptRow = {
          _id: json.receipt?._id || `temp-${Date.now()}`,
          storeName: editForm.storeName || "",
          amount: total,
          category: editForm.category || "ไม่ระบุ",
          date: new Date(editForm.date || now).toLocaleDateString("th-TH"),
          rawDate: editForm.date || now.slice(0, 10),
          status: "pending",
          type: editForm.type || "receipt",
          source: "web",
          paymentMethod: editForm.paymentMethod || "cash",
          time: editForm.time || "",
          direction: txType === "income" ? "income" : (txType as string) === "savings" ? "savings" : "expense",
          note: editForm.note || "",
          vat,
          wht,
          documentNumber: editForm.documentNumber || "",
          merchantTaxId: editForm.merchantTaxId || "",
          imageUrl: slipPreview || "",
          hasImage: !!slipPreview,
          items: editItems,
          itemCount: editItems.length,
          createdAt: now,
          updatedAt: now,
        };
        setReceipts((prev) => [newReceipt, ...prev]);
        setIsAdding(false);
        setEditForm({});
        setEditItems([]);
        setSlipPreview(null);
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const paymentLabel: Record<string, string> = {};
  PAYMENT_METHODS.forEach((p) => { paymentLabel[p.value] = p.label; });

  // Dynamic category options — predefined + any from data
  const categoryOptions = useMemo(() => {
    const opts = Object.entries(CATEGORY_COLORS).map(([c, color]) => ({ value: c, label: c, dot: color }));
    const existing = new Set(opts.map((o) => o.value));
    receipts.forEach((r) => {
      if (r.category && !existing.has(r.category)) {
        existing.add(r.category);
        opts.push({ value: r.category, label: r.category, dot: getCatColor(r.category) });
      }
    });
    return opts;
  }, [receipts]);

  const columns: Column<ReceiptRow>[] = useMemo(() => [
    {
      key: "image",
      label: "รูป",
      render: (r, dark) => (
        r.imageUrl
          ? <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#FA3633]/50 transition-all ${dark ? "bg-white/5" : "bg-gray-100"}`} onClick={(e) => { e.stopPropagation(); setLightboxUrl(r.imageUrl!); }}>
              <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          : <LazyImage id={r._id} hasImage={r.hasImage} onClickFull={setLightboxUrl} isDark={dark} />
      ),
    },
    {
      key: "storeName",
      label: "รายละเอียด",
      render: (r) => {
        const dir = r.direction || "expense";
        const dirLabel = dir === "income" ? "รายรับ" : dir === "savings" ? "เงินออม" : "รายจ่าย";
        const dirCls = dir === "income" ? "bg-green-500/10 text-green-500" : dir === "savings" ? "bg-pink-500/10 text-pink-400" : "bg-red-500/10 text-red-400";
        return (
          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{r.storeName}</span>
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none ${dirCls}`}>{dirLabel}</span>
            </div>
            <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${muted}`}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(r.category) }} />
                {r.category}
              </span>
              <span>·</span>
              <span>{typeLabel[r.type] || r.type}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "amount",
      label: "จำนวนเงิน",
      align: "right",
      render: (r) => {
        const dir = r.direction || "expense";
        return <Baht value={r.amount} className="font-semibold" />;
      },
    },
    {
      key: "paidAt",
      label: "เวลาในสลิป",
      render: (r) => {
        const iso = r.rawDate;
        if (!iso) return <span className={muted}>-</span>;
        const d = new Date(iso);
        const day = d.getDate();
        const mon = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()];
        const yr = d.getFullYear() + 543;
        const time = r.time || "";
        const isLine = r.source === "line";
        return (
          <div className="leading-tight">
            <div className="text-sm whitespace-nowrap">{day} {mon} {yr}{time ? <span className={`text-[11px] ml-1 ${muted}`}>{time}</span> : ""}</div>
            <div className={`flex items-center gap-1 mt-0.5 text-[11px]`}>
              <span className={isLine ? "text-green-500" : "text-blue-400"}>
                {isLine ? "LINE" : "เว็บ"}
              </span>
              {r.submittedBy && <span className={muted}>· {r.submittedBy}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: "updatedAt",
      label: "อัปเดตล่าสุด",
      defaultVisible: false,
      render: (r) => {
        if (!r.updatedAt) return <span className={muted}>-</span>;
        const d = new Date(r.updatedAt);
        const date = d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
        const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
        return <span className={`text-xs ${muted}`}>{date} {time}</span>;
      },
    },
    {
      key: "paymentMethod",
      label: "วิธีจ่าย",
      defaultVisible: false,
      render: (r) => <span>{paymentLabel[r.paymentMethod || ""] || r.paymentMethod || "-"}</span>,
    },
    {
      key: "note",
      label: "หมายเหตุ",
      defaultVisible: false,
      render: (r) => <span className={`truncate max-w-[150px] inline-block ${muted}`}>{r.note || "-"}</span>,
    },
    {
      key: "vat",
      label: "VAT",
      align: "right",
      defaultVisible: false,
      render: (r) => r.vat ? <Baht value={r.vat} className="text-blue-400" /> : <span className={muted}>-</span>,
    },
    {
      key: "wht",
      label: "WHT",
      align: "right",
      defaultVisible: false,
      render: (r) => r.wht ? <Baht value={r.wht} className="text-orange-400" /> : <span className={muted}>-</span>,
    },
    {
      key: "documentNumber",
      label: "เลขที่เอกสาร",
      defaultVisible: false,
      render: (r) => <span className={muted}>{r.documentNumber || "-"}</span>,
    },
    {
      key: "merchantTaxId",
      label: "เลขผู้เสียภาษี",
      defaultVisible: false,
      render: (r) => <span className={muted}>{r.merchantTaxId || "-"}</span>,
    },
    {
      key: "ocrConfidence",
      label: "OCR %",
      align: "center",
      defaultVisible: false,
      render: (r) => {
        if (r.ocrConfidence == null) return <span className={muted}>-</span>;
        const pct = Math.round(r.ocrConfidence * 100);
        const color = pct >= 90 ? "text-green-400" : pct >= 70 ? "text-yellow-400" : "text-red-400";
        return <span className={`text-xs font-medium ${color}`}>{pct}%</span>;
      },
    },
    {
      key: "itemCount",
      label: "จำนวนรายการ",
      align: "center",
      defaultVisible: false,
      render: (r) => <span className={muted}>{r.itemCount || "-"}</span>,
    },
    {
      key: "drive",
      label: "Drive",
      align: "center",
      render: (r, dark) => (
        <div className="relative group flex justify-center">
          {(r.hasImage || r.imageUrl) ? <Cloud size={16} className="text-green-500" /> : <CloudOff size={16} className={dark ? "text-white/20" : "text-gray-300"} />}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${dark ? "bg-[#2a2a2a] text-white border border-white/10" : "bg-white text-gray-900 border border-gray-200 shadow-lg"}`}>
            {(r.hasImage || r.imageUrl) ? "อัปโหลดแล้ว" : "ยังไม่ได้อัปโหลด"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle[r.status] || statusStyle.pending}`}>{statusLabel[r.status] || r.status}</span>,
    },
    {
      key: "actions",
      label: "",
      configurable: false,
      render: (r, dark) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleEdit(r)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-blue-400" : "hover:bg-gray-100 text-gray-400 hover:text-blue-500"}`} title="แก้ไข">
            <Pencil size={14} />
          </button>
          <button onClick={() => handleDelete(r._id)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`} title="ลบ">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [handleDelete]);

  const expandRender = (r: ReceiptRow, dark: boolean) => {
    const items = r.items && r.items.length > 0 ? r.items : [{ name: r.storeName, qty: 1, price: r.amount }];
    const b = dark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
    return (
      <div className="space-y-2">
        <p className={`text-xs font-semibold ${dark ? "text-white/60" : "text-gray-600"}`}>รายละเอียดสินค้า/บริการ ({items.length} รายการ)</p>
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-2 rounded-lg ${dark ? "bg-white/3" : "bg-gray-100/50"}`}>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium w-6 h-6 rounded-md flex items-center justify-center ${dark ? "bg-white/5 text-white/40" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
                <span className={`text-sm ${dark ? "text-white" : "text-gray-900"}`}>{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>x{item.qty}</span>
                <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>฿{item.price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={`flex justify-end pt-2 border-t ${b}`}>
          <span className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>รวม ฿{r.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    );
  };

  const editingReceipt = editingId ? receipts.find((r) => r._id === editingId) : null;
  const panelInput = isDark ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] text-white" : "bg-white border-gray-200 text-gray-900";
  const panelLabel = isDark ? "text-white/50" : "text-gray-500";

  return (
    <div className="space-y-6">
      {/* Image lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="สลิป" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
            <button onClick={() => setLightboxUrl(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black/70 text-white/80 hover:text-white flex items-center justify-center text-lg transition-colors border border-white/20">&times;</button>
          </div>
        </div>
      )}

      {/* Slide-in panel from right (edit + add) */}
      {(editingId || isAdding) && <div className="fixed inset-0 z-40 bg-black/60 transition-opacity" onClick={handleCancelEdit} />}
      {(editingId || isAdding) && (editingReceipt || isAdding) && (
      <div className="fixed inset-y-0 right-0 z-50 w-[540px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
        {(() => {
          const itemsTotal = editItems.reduce((s, it) => s + it.qty * it.price, 0);
          const vatAmount = vatEnabled ? Math.round(itemsTotal * 0.07) : 0;
          const whtAmount = whtEnabled ? Math.round(itemsTotal * 0.03) : 0;
          const grandTotal = itemsTotal + vatAmount - whtAmount;
          const inp = "w-full h-9 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50";
          const lbl = "block text-xs text-white/40 mb-1";

          return (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{isAdding ? "เพิ่มใบเสร็จ" : "แก้ไขใบเสร็จ"}</h2>
              <button onClick={handleCancelEdit} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl transition-colors">&times;</button>
            </div>

            {/* Slip image — upload / preview */}
            <input ref={slipInputRef} type="file" accept="image/*" onChange={handleSlipInputChange} className="hidden" />
            {slipPreview ? (
              <div className="relative w-full rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                <img src={slipPreview} alt="สลิป" className="w-full max-h-72 object-contain" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => slipInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 text-white hover:bg-white/30 transition-colors">เปลี่ยนรูป</button>
                  <button onClick={handleSlipRemove} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"><X size={14} /></button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => slipInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setSlipDragging(true); }}
                onDragLeave={() => setSlipDragging(false)}
                onDrop={handleSlipDrop}
                className={`w-full h-44 rounded-xl border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${slipDragging ? "border-[#FA3633]/50 bg-[#FA3633]/5" : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"}`}
              >
                <Upload size={28} className="text-white/20" />
                <p className="text-xs text-white/40">คลิกหรือลากรูปสลิปมาวาง</p>
                <p className="text-[10px] text-white/20">PNG, JPG, WEBP</p>
              </div>
            )}

            {/* Income / Expense / Savings toggle */}
            <div className="flex p-1 rounded-xl bg-white/5">
              <button onClick={() => setTxType("income")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${txType === "income" ? "bg-green-500 text-white shadow-sm" : "text-white/50 hover:text-white/70"}`}>รายรับ</button>
              <button onClick={() => setTxType("expense")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${txType === "expense" ? "bg-red-500 text-white shadow-sm" : "text-white/50 hover:text-white/70"}`}>รายจ่าย</button>
              <button onClick={() => setTxType("savings" as any)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${(txType as string) === "savings" ? "bg-pink-500 text-white shadow-sm" : "text-white/50 hover:text-white/70"}`}>เงินออม</button>
            </div>

            {/* ═══ EXPENSE TAB ═══ */}
            {txType === "expense" && (<>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-white/50">ข้อมูลรายจ่าย</p>
              <div><label className={lbl}>ร้านค้า</label><input value={editForm.storeName || ""} onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>หมายเหตุ</label><textarea rows={2} value={editForm.note || ""} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="รายละเอียดเพิ่มเติม..." className={`${inp} h-auto py-2`} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lbl}>วันที่จ่าย</label><DatePicker value={editForm.date || ""} onChange={(v) => setEditForm({ ...editForm, date: v })} /></div>
                <div><label className={lbl}>เวลา</label><TimePicker value={editForm.time || ""} onChange={(v) => setEditForm({ ...editForm, time: v })} /></div>
                <div><label className={lbl}>วิธีจ่าย</label><Select value={editForm.paymentMethod || "cash"} onChange={(v) => setEditForm({ ...editForm, paymentMethod: v })} options={PAYMENT_METHODS} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>หมวดหมู่</label><Select value={editForm.category || "ไม่ระบุ"} onChange={(v) => setEditForm({ ...editForm, category: v })} options={categoryOptions} /></div>
                <div><label className={lbl}>สถานะ</label><Select value={editForm.status || "pending"} onChange={(v) => setEditForm({ ...editForm, status: v })} options={STATUS_OPTIONS} /></div>
              </div>
              <div><label className={lbl}>ประเภทเอกสาร</label><Select value={editForm.type || "receipt"} onChange={(v) => setEditForm({ ...editForm, type: v })} options={Object.entries(typeLabel).map(([k, v]) => ({ value: k, label: v }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>เลขที่เอกสาร</label><input value={editForm.documentNumber || ""} onChange={(e) => setEditForm({ ...editForm, documentNumber: e.target.value })} placeholder="RCP-2026-0001" className={inp} /></div>
                <div><label className={lbl}>เลขผู้เสียภาษี</label><input value={editForm.merchantTaxId || ""} onChange={(e) => setEditForm({ ...editForm, merchantTaxId: e.target.value })} placeholder="0107536000269" className={inp} /></div>
              </div>
            </div>
            {/* Line items */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/50">รายการสินค้า/บริการ</p>
                <button onClick={() => setEditItems([...editItems, { name: "", qty: 1, price: 0 }])} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">+ เพิ่มรายการ</button>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/30 font-medium">
                <span className="w-5 shrink-0">#</span><span className="flex-1">รายการ</span><span className="w-12 text-center">จำนวน</span><span className="w-20 text-right">ราคา</span><span className="w-20 text-right">รวม</span><span className="w-7 shrink-0"></span>
              </div>
              <div className="space-y-2">
                {editItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded text-[10px] font-medium bg-white/5 text-white/30 flex items-center justify-center shrink-0">{i + 1}</span>
                    <input value={item.name} onChange={(e) => { const n = [...editItems]; n[i] = { ...n[i], name: e.target.value }; setEditItems(n); }} placeholder="ชื่อรายการ" className="flex-1 h-8 px-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-none focus:border-[#FA3633]/50" />
                    <input type="number" value={item.qty} min={1} onChange={(e) => { const n = [...editItems]; n[i] = { ...n[i], qty: Math.max(1, Number(e.target.value)) }; setEditItems(n); }} className="w-12 h-8 px-2 bg-white/5 border border-white/10 text-white rounded text-xs text-center focus:outline-none" />
                    <input type="number" value={item.price} onChange={(e) => { const n = [...editItems]; n[i] = { ...n[i], price: Number(e.target.value) }; setEditItems(n); }} placeholder="0" className="w-20 h-8 px-2 bg-white/5 border border-white/10 text-white rounded text-xs text-right focus:outline-none" />
                    <span className="w-20 text-right text-xs font-medium text-white/60">฿{(item.qty * item.price).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                    {editItems.length > 1 ? <button onClick={() => setEditItems(editItems.filter((_, j) => j !== i))} className="w-7 h-7 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 flex items-center justify-center transition-colors shrink-0"><Trash2 size={12} /></button> : <span className="w-7 shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3"><div className="flex justify-between text-sm"><span className="text-white/40">รวม ({editItems.length} รายการ)</span><span className="text-white font-medium">฿{itemsTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div></div>
            </div>
            {/* VAT/WHT */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-white/50">ภาษี</p>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div><p className="text-sm text-white">VAT 7%</p><p className="text-xs text-white/30">ภาษีมูลค่าเพิ่ม</p></div>
                <button onClick={() => setVatEnabled(!vatEnabled)} className={`w-11 h-6 rounded-full transition-colors relative ${vatEnabled ? "bg-[#FA3633]" : "bg-white/10"}`}><div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${vatEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} /></button>
              </label>
              {vatEnabled && <div className="flex justify-between text-sm pl-1"><span className="text-white/40">VAT 7%</span><span className="text-blue-400 font-medium">+฿{vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div>}
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div><p className="text-sm text-white">WHT 3%</p><p className="text-xs text-white/30">ภาษีหัก ณ ที่จ่าย</p></div>
                <button onClick={() => setWhtEnabled(!whtEnabled)} className={`w-11 h-6 rounded-full transition-colors relative ${whtEnabled ? "bg-[#FA3633]" : "bg-white/10"}`}><div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${whtEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} /></button>
              </label>
              {whtEnabled && <div className="flex justify-between text-sm pl-1"><span className="text-white/40">WHT 3%</span><span className="text-orange-400 font-medium">-฿{whtAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div>}
            </div>
            </>)}

            {/* ═══ INCOME TAB ═══ */}
            {txType === "income" && (
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-green-500/70">ข้อมูลรายรับ</p>
              <div><label className={lbl}>แหล่งที่มา</label><input value={editForm.storeName || ""} onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })} placeholder="เช่น บริษัท ABC, ลูกค้า, ฟรีแลนซ์" className={inp} /></div>
              <div><label className={lbl}>จำนวนเงินที่ได้รับ (฿)</label><input type="number" value={editItems[0]?.price || ""} onChange={(e) => { const n = [...editItems]; n[0] = { ...n[0], name: editForm.storeName || "รายรับ", qty: 1, price: Number(e.target.value) }; setEditItems(n); }} placeholder="0.00" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>วันที่รับ</label><DatePicker value={editForm.date || ""} onChange={(v) => setEditForm({ ...editForm, date: v })} /></div>
                <div><label className={lbl}>เวลา</label><TimePicker value={editForm.time || ""} onChange={(v) => setEditForm({ ...editForm, time: v })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>หมวดรายรับ</label>
                  <Select value={editForm.category || "อื่นๆ"} onChange={(v) => setEditForm({ ...editForm, category: v })} options={[
                    { value: "เงินเดือน", label: "เงินเดือน", dot: "#22c55e" },
                    { value: "ฟรีแลนซ์", label: "ฟรีแลนซ์", dot: "#3b82f6" },
                    { value: "ขายของ", label: "ขายของ", dot: "#f59e0b" },
                    { value: "ลงทุน", label: "ลงทุน", dot: "#8b5cf6" },
                    { value: "โบนัส", label: "โบนัส", dot: "#ec4899" },
                    { value: "คืนเงิน", label: "คืนเงิน", dot: "#06b6d4" },
                    { value: "อื่นๆ", label: "อื่นๆ", dot: "#78716c" },
                  ]} />
                </div>
                <div><label className={lbl}>วิธีรับเงิน</label><Select value={editForm.paymentMethod || "transfer"} onChange={(v) => setEditForm({ ...editForm, paymentMethod: v })} options={PAYMENT_METHODS} /></div>
              </div>
              <div><label className={lbl}>หมายเหตุ</label><textarea rows={2} value={editForm.note || ""} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="รายละเอียดเพิ่มเติม..." className={`${inp} h-auto py-2`} /></div>
            </div>
            )}

            {/* ═══ SAVINGS TAB ═══ */}
            {(txType as string) === "savings" && (
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-pink-400/70">บันทึกเงินออม</p>
              <div><label className={lbl}>เป้าหมาย</label><input value={editForm.savingsGoal || ""} onChange={(e) => setEditForm({ ...editForm, savingsGoal: e.target.value })} placeholder="เช่น ท่องเที่ยวญี่ปุ่น, MacBook Pro" className={inp} /></div>
              <div><label className={lbl}>จำนวนที่ออม (฿)</label><input type="number" value={editForm.savingsAmount || ""} onChange={(e) => setEditForm({ ...editForm, savingsAmount: e.target.value })} placeholder="0.00" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>วันที่ออม</label><DatePicker value={editForm.date || ""} onChange={(v) => setEditForm({ ...editForm, date: v })} /></div>
                <div><label className={lbl}>วิธีออม</label>
                  <Select value={editForm.paymentMethod || "transfer"} onChange={(v) => setEditForm({ ...editForm, paymentMethod: v })} options={[
                    { value: "transfer", label: "โอนเข้าบัญชีออม" },
                    { value: "cash", label: "หยอดกระปุก" },
                    { value: "debit", label: "ตัดบัตรอัตโนมัติ" },
                    { value: "other", label: "อื่นๆ" },
                  ]} />
                </div>
              </div>
              <div><label className={lbl}>หมายเหตุ</label><textarea rows={2} value={editForm.note || ""} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="เช่น ออมจากเงินทอน, โบนัส..." className={`${inp} h-auto py-2`} /></div>
            </div>
            )}

            {/* Grand total — show for expense/income */}
            {txType !== "savings" as any && (
            <div className={`rounded-xl p-4 ${txType === "income" ? "bg-green-500/10 border border-green-500/20" : "bg-[#FA3633]/10 border border-[#FA3633]/20"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/70">{txType === "income" ? "ยอดรับ" : "ยอดสุทธิ"}</span>
                <span className={`text-2xl font-bold text-white`}>฿{grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
              {txType === "expense" && (vatEnabled || whtEnabled) && (
                <p className="text-[11px] text-white/30 mt-1">สินค้า ฿{itemsTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}{vatEnabled ? ` + VAT ฿${vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : ""}{whtEnabled ? ` - WHT ฿${whtAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : ""}</p>
              )}
              {!isAdding && editingReceipt && txType === "expense" && grandTotal !== editingReceipt.amount && grandTotal > 0 && (
                <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10">
                  <span className="text-amber-400 text-sm mt-0.5">⚠</span>
                  <p className="text-[11px] text-amber-400/60">OCR: ฿{editingReceipt.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} → แก้ไข: ฿{grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
            )}

            {/* Savings total */}
            {(txType as string) === "savings" && editForm.savingsAmount && (
            <div className="rounded-xl p-4 bg-pink-500/10 border border-pink-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/70">ออมครั้งนี้</span>
                <span className="text-2xl font-bold text-white">฿{Number(editForm.savingsAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
              {editForm.savingsGoal && <p className="text-[11px] text-pink-400/60 mt-1">เป้าหมาย: {editForm.savingsGoal}</p>}
            </div>
            )}

            {/* File attachments */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
              <FileAttachments files={attachments} onChange={setAttachments} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button
                onClick={isAdding ? handleSaveAdd : handleSaveEdit}
                disabled={saving || (isAdding && !editForm.storeName)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {isAdding ? "เพิ่มใบเสร็จ" : "บันทึก"}
              </button>
              <button onClick={handleCancelEdit} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
          );
        })()}
      </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="ใบเสร็จทั้งหมด" description={`${filtered.length} รายการ — รวม ฿${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} />
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25"
        >
          <Plus size={16} />
          เพิ่มสลิป
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ใบเสร็จทั้งหมด" value={`${filtered.length} รายการ`} icon={<Receipt size={20} />} color="text-blue-500" />
        <StatsCard label="ยอดรวม" value={`฿${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<FileText size={20} />} color="text-[#FA3633]" />
        <StatsCard label="ยืนยันแล้ว" value={`${confirmed} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="รอตรวจสอบ" value={`${pending} รายการ`} icon={<Clock size={20} />} color="text-yellow-500" />
      </div>

      {/* Filters — select dropdowns */}
      <div className={`${card} border ${border} rounded-xl px-5 py-3`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub}`} />
            <input type="text" placeholder="ค้นหาร้านค้า, หมวดหมู่..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
          </div>
          <Filter size={16} className={sub} />
          <Select value={statusFilter} onChange={setStatusFilter} className="w-44" options={[{ value: "all", label: "สถานะทั้งหมด" }, ...STATUS_OPTIONS]} />
          <Select value={typeFilter} onChange={setTypeFilter} className="w-40" options={[{ value: "all", label: "ประเภททั้งหมด" }, ...Object.entries(typeLabel).map(([k, v]) => ({ value: k, label: v }))]} />
          <Select value={driveFilter} onChange={setDriveFilter} className="w-44" options={[{ value: "all", label: "Drive ทั้งหมด" }, { value: "uploaded", label: "อัปโหลดแล้ว" }, { value: "not_uploaded", label: "ยังไม่อัปโหลด" }]} />
        </div>
      </div>

      <DataTable dateField="rawDate" columns={columns} data={filtered} rowKey={(r) => r._id} expandRender={expandRender} columnConfigKey="receipts" />
    </div>
  );
}
