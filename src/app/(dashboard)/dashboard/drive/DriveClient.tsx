"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Cloud, Grid3X3, List, Search, ImageIcon, FileText, Filter, Download, Eye, MessageCircle, Globe } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

interface Doc {
  _id: string; name: string; category: string; amount: number;
  date: string; rawDate: string; time: string; status: string;
  source: string; direction: string; hasImage: boolean;
  paymentMethod: string; createdAt: string;
}

const DIR_CLR: Record<string, string> = { expense: "#FA3633", income: "#22c55e", savings: "#ec4899" };
const DIR_LABEL: Record<string, string> = { expense: "รายจ่าย", income: "รายรับ", savings: "เงินออม" };
const STATUS_CLS: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-400", pending: "bg-yellow-500/10 text-yellow-400",
  duplicate: "bg-orange-500/10 text-orange-400", cancelled: "bg-gray-500/10 text-gray-400",
  edited: "bg-blue-500/10 text-blue-400",
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: "ยืนยัน", pending: "รอตรวจ", duplicate: "ซ้ำ", cancelled: "ยกเลิก", edited: "แก้ไข",
};

export default function DriveClient({ docs }: { docs: Doc[] }) {
  const { isDark } = useTheme();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterDir, setFilterDir] = useState("all");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const filtered = docs.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
    const matchDir = filterDir === "all" || d.direction === filterDir;
    return matchSearch && matchDir;
  });

  const withImage = docs.filter((d) => d.hasImage).length;
  const totalAmount = docs.reduce((s, d) => s + d.amount, 0);

  // Lazy load image
  const loadImage = async (id: string) => {
    if (images[id]) { setLightbox(images[id]); return; }
    try {
      const res = await fetch(`/api/receipts/image?id=${id}`);
      const data = await res.json();
      if (data.imageUrl) { setImages((prev) => ({ ...prev, [id]: data.imageUrl })); setLightbox(data.imageUrl); }
    } catch {}
  };

  // Lazy load thumbnails for grid view
  const ThumbImage = ({ id, hasImage }: { id: string; hasImage: boolean }) => {
    const [src, setSrc] = useState<string | null>(images[id] || null);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!hasImage || src) return;
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          fetch(`/api/receipts/image?id=${id}`).then((r) => r.json()).then((d) => {
            if (d.imageUrl) { setSrc(d.imageUrl); setImages((prev) => ({ ...prev, [id]: d.imageUrl })); }
          }).catch(() => {});
          obs.disconnect();
        }
      }, { rootMargin: "200px" });
      obs.observe(el);
      return () => obs.disconnect();
    }, [id, hasImage, src]);

    return (
      <div ref={ref} className={`w-full h-full flex items-center justify-center ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
        {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : (
          hasImage ? <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isDark ? "border-white/10" : "border-gray-200"}`} />
          : <FileText size={24} className={muted} />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox} alt="" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
            <button onClick={() => setLightbox(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black/70 text-white/80 hover:text-white flex items-center justify-center text-lg border border-white/20">&times;</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="Cloud Drive" description={`${docs.length} เอกสาร · ${withImage} มีรูป`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="เอกสารทั้งหมด" value={`${docs.length} รายการ`} icon={<Cloud size={20} />} color="text-blue-500" />
        <StatsCard label="มีรูปสลิป" value={`${withImage} รายการ`} icon={<ImageIcon size={20} />} color="text-green-500" />
        <StatsCard label="ยอดรวม" value={`฿${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} icon={<FileText size={20} />} color="text-[#FA3633]" />
        <StatsCard label="เดือนนี้" value={`${docs.filter((d) => new Date(d.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length} รายการ`} icon={<Download size={20} />} color="text-purple-500" />
      </div>

      {/* Toolbar */}
      <div className={`${card} border ${border} rounded-xl px-4 py-3 flex flex-wrap items-center gap-3`}>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub}`} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาเอกสาร..." className={`w-full h-9 pl-8 pr-3 rounded-lg text-sm border ${isDark ? "bg-white/[0.03] border-white/[0.06] text-white placeholder-white/30" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"} focus:outline-none`} />
        </div>
        <div className="flex gap-1">
          {[{ v: "all", l: "ทั้งหมด" }, { v: "expense", l: "รายจ่าย" }, { v: "income", l: "รายรับ" }, { v: "savings", l: "เงินออม" }].map((f) => (
            <button key={f.v} onClick={() => setFilterDir(f.v)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterDir === f.v ? "bg-[#FA3633] text-white" : isDark ? "bg-white/5 text-white/50 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{f.l}</button>
          ))}
        </div>
        <div className={`flex rounded-lg overflow-hidden border ${border}`}>
          <button onClick={() => setView("grid")} className={`p-2 transition-colors ${view === "grid" ? "bg-[#FA3633] text-white" : isDark ? "text-white/40 hover:bg-white/5" : "text-gray-400 hover:bg-gray-100"}`}><Grid3X3 size={14} /></button>
          <button onClick={() => setView("list")} className={`p-2 transition-colors ${view === "list" ? "bg-[#FA3633] text-white" : isDark ? "text-white/40 hover:bg-white/5" : "text-gray-400 hover:bg-gray-100"}`}><List size={14} /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={`${card} border ${border} rounded-2xl p-12 text-center ${sub}`}>ไม่พบเอกสาร</div>
      ) : view === "grid" ? (
        /* Grid view */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((doc) => (
            <div key={doc._id} className={`${card} border ${border} rounded-xl overflow-hidden group cursor-pointer transition-all hover:shadow-lg ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-gray-50"}`} onClick={() => doc.hasImage ? loadImage(doc._id) : null}>
              {/* Thumbnail */}
              <div className="aspect-[4/3] overflow-hidden relative">
                <ThumbImage id={doc._id} hasImage={doc.hasImage} />
                {/* Overlay on hover */}
                {doc.hasImage && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye size={20} className="text-white" />
                  </div>
                )}
                {/* Direction badge */}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white leading-none" style={{ backgroundColor: DIR_CLR[doc.direction] || "#94A3B8" }}>{DIR_LABEL[doc.direction] || "อื่นๆ"}</span>
              </div>
              {/* Info */}
              <div className="p-3">
                <p className={`text-xs font-medium ${txt} truncate`}>{doc.name}</p>
                <div className={`flex items-center justify-between mt-1`}>
                  <span className={`text-[10px] ${muted}`}>{doc.date}</span>
                  <span className={`text-[10px] font-semibold ${txt}`}>฿{doc.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
          {filtered.map((doc, i) => (
            <div key={doc._id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? `border-t ${border}` : ""} ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50"} transition-colors cursor-pointer`} onClick={() => doc.hasImage ? loadImage(doc._id) : null}>
              {/* Mini thumb */}
              <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                {doc.hasImage ? <ThumbImage id={doc._id} hasImage={true} /> : <div className="w-full h-full flex items-center justify-center"><FileText size={14} className={muted} /></div>}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${txt} truncate`}>{doc.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white leading-none shrink-0" style={{ backgroundColor: DIR_CLR[doc.direction] || "#94A3B8" }}>{DIR_LABEL[doc.direction] || ""}</span>
                </div>
                <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${muted}`}>
                  <span>{doc.category}</span>
                  <span>·</span>
                  <span>{doc.date}{doc.time ? ` ${doc.time}` : ""}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">{doc.source === "line" ? <><MessageCircle size={9} className="text-green-500" /> LINE</> : <><Globe size={9} className="text-blue-400" /> เว็บ</>}</span>
                </div>
              </div>
              {/* Amount */}
              <span className={`text-sm font-semibold ${txt} shrink-0`}>฿{doc.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              {/* Status */}
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium shrink-0 ${STATUS_CLS[doc.status] || STATUS_CLS.pending}`}>{STATUS_LABEL[doc.status] || doc.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
