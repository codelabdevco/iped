"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Cloud, Grid3X3, List, Search, ImageIcon, FileText, Upload, Eye, MessageCircle, Globe, Trash2, Download, File, FileSpreadsheet, FileImage, FileVideo, FileArchive } from "lucide-react";
import BrandIcon from "@/components/dashboard/BrandIcon";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";

interface Doc {
  _id: string; name: string; fileType: "receipt" | "file"; mimeType: string;
  category: string; amount: number; date: string; time: string;
  status: string; source: string; direction: string;
  hasImage: boolean; size: number; createdAt: string;
}

const DIR_CLR: Record<string, string> = { expense: "#FA3633", income: "#22c55e", savings: "#ec4899" };
const DIR_LABEL: Record<string, string> = { expense: "รายจ่าย", income: "รายรับ", savings: "เงินออม" };

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return { icon: ImageIcon, color: "#22c55e", label: "รูปภาพ" };
  if (mime === "application/pdf") return { icon: FileText, color: "#EF4444", label: "PDF" };
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return { icon: FileSpreadsheet, color: "#22c55e", label: "Excel" };
  if (mime.includes("word") || mime.includes("document")) return { icon: FileText, color: "#3b82f6", label: "Word" };
  if (mime.startsWith("video/")) return { icon: FileVideo, color: "#8b5cf6", label: "วิดีโอ" };
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return { icon: FileArchive, color: "#f59e0b", label: "บีบอัด" };
  return { icon: File, color: "#94A3B8", label: "ไฟล์" };
}

function formatSize(bytes: number) {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DriveClient({ docs: initial, totalStorageBytes = 0 }: { docs: Doc[]; totalStorageBytes?: number }) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);

  // Check Google Drive status
  useEffect(() => {
    fetch("/api/auth/google/status").then((r) => r.json()).then((d) => setDriveConnected(d.connected)).catch(() => setDriveConnected(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/drive/sync", { method: "POST" });
      const data = await res.json();
      if (data.error) { setSyncResult(data.error); return; }
      setSyncResult(`อัปโหลด ${data.uploaded} ไฟล์ (เหลือ ${data.remaining} ไฟล์)`);
    } catch { setSyncResult("เกิดข้อผิดพลาด"); }
    finally { setSyncing(false); }
  };
  const { isDark } = useTheme();
  const [docs, setDocs] = useState(initial);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const filtered = docs.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    if (filterType === "all") return matchSearch;
    if (filterType === "receipt") return matchSearch && d.fileType === "receipt";
    if (filterType === "image") return matchSearch && d.mimeType.startsWith("image/");
    if (filterType === "pdf") return matchSearch && d.mimeType === "application/pdf";
    if (filterType === "file") return matchSearch && d.fileType === "file";
    return matchSearch;
  });

  const receiptCount = docs.filter((d) => d.fileType === "receipt").length;
  const fileCount = docs.filter((d) => d.fileType === "file").length;
  const imageCount = docs.filter((d) => d.hasImage || d.mimeType.startsWith("image/")).length;

  // Upload
  const handleUpload = async (fileList: FileList) => {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/files", { method: "POST", body: formData });
        if (res.ok) {
          const json = await res.json();
          setDocs((prev) => [{
            _id: json.file._id, name: file.name, fileType: "file", mimeType: file.type,
            category: "", amount: 0, date: new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }),
            time: "", status: "confirmed", source: "web", direction: "",
            hasImage: file.type.startsWith("image/"), size: file.size,
            createdAt: new Date().toISOString(),
          }, ...prev]);
        }
      } catch {}
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm("ลบไฟล์นี้?")) return;
    if (type === "file") {
      await fetch("/api/files", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    }
    setDocs((prev) => prev.filter((d) => d._id !== id));
  };

  const handleView = async (doc: Doc) => {
    if (doc.fileType === "receipt") {
      if (images[doc._id]) { setLightbox(images[doc._id]); return; }
      if (!doc.hasImage) return;
      try {
        const res = await fetch(`/api/receipts/image?id=${doc._id}`);
        const data = await res.json();
        if (data.imageUrl) { setImages((prev) => ({ ...prev, [doc._id]: data.imageUrl })); setLightbox(data.imageUrl); }
      } catch {}
    } else {
      try {
        const res = await fetch(`/api/files/download?id=${doc._id}`);
        const data = await res.json();
        if (data.data) {
          if (data.type.startsWith("image/") || data.type === "application/pdf") {
            setLightbox(data.data);
          } else {
            const a = document.createElement("a");
            a.href = data.data;
            a.download = data.name;
            a.click();
          }
        }
      } catch {}
    }
  };

  // Thumbnail
  const Thumb = ({ doc }: { doc: Doc }) => {
    const [src, setSrc] = useState<string | null>(images[doc._id] || null);
    const ref = useRef<HTMLDivElement>(null);
    const isImage = doc.mimeType.startsWith("image/");
    useEffect(() => {
      if (src || !isImage && doc.fileType !== "receipt") return;
      if (doc.fileType === "receipt" && !doc.hasImage) return;
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          const url = doc.fileType === "receipt" ? `/api/receipts/image?id=${doc._id}` : `/api/files/download?id=${doc._id}`;
          fetch(url).then((r) => r.json()).then((d) => {
            const imgData = d.imageUrl || d.data;
            if (imgData) { setSrc(imgData); setImages((prev) => ({ ...prev, [doc._id]: imgData })); }
          }).catch(() => {});
          obs.disconnect();
        }
      }, { rootMargin: "200px" });
      obs.observe(el);
      return () => obs.disconnect();
    }, [doc, src, isImage]);

    const fi = getFileIcon(doc.mimeType);
    const Icon = fi.icon;

    return (
      <div ref={ref} className={`w-full h-full flex items-center justify-center ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
        {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : (
          <div className="flex flex-col items-center gap-1">
            <Icon size={24} style={{ color: fi.color }} />
            <span className={`text-[9px] ${muted}`}>{fi.label}</span>
          </div>
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
            {lightbox.startsWith("data:application/pdf") ? (
              <iframe src={lightbox} className="w-[80vw] h-[85vh] rounded-2xl" />
            ) : (
              <img src={lightbox} alt="" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
            )}
            <button onClick={() => setLightbox(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black/70 text-white/80 hover:text-white flex items-center justify-center text-lg border border-white/20">&times;</button>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple onChange={(e) => { if (e.target.files) handleUpload(e.target.files); e.target.value = ""; }} className="hidden" />

      <div className="flex items-center justify-between">
        <PageHeader title="Cloud Drive" description={`${docs.length} เอกสาร · ${imageCount} รูป · ${fileCount} ไฟล์`} />
        <div className="flex gap-2">
          {driveConnected && (
            <button onClick={handleSync} disabled={syncing} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              <Cloud size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? "กำลังซิงค์..." : "ซิงค์ Drive"}
            </button>
          )}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25 disabled:opacity-50">
            <Upload size={16} />{uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="เอกสารทั้งหมด" value={`${docs.length} รายการ`} icon={<Cloud size={20} />} color="text-blue-500" />
        <StatsCard label="ใบเสร็จ / ไฟล์" value={`${receiptCount} / ${fileCount}`} icon={<FileText size={20} />} color="text-[#FA3633]" />
        <StatsCard label="ใช้พื้นที่" value={formatSize(totalStorageBytes + docs.filter(d=>d.fileType==="receipt"&&d.hasImage).length * 250000)} icon={<Download size={20} />} color="text-purple-500" />
        <StatsCard label="Google Drive" value={driveConnected === null ? "กำลังเช็ค..." : driveConnected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"} icon={<Cloud size={20} />} color={driveConnected ? "text-green-500" : "text-orange-500"} />
      </div>

      {/* Sync result */}
      {syncResult && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"}`}>
          <Cloud size={14} /> {syncResult}
          <button onClick={() => setSyncResult(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Drive not connected notice */}
      {driveConnected === false && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200"}`}>
          <Cloud size={16} className="text-amber-500 shrink-0" />
          <span className={`text-xs flex-1 ${txt}`}>เชื่อมต่อ Google Drive เพื่อสำรองเอกสารอัตโนมัติ</span>
          <a href="/api/auth/google" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FA3633] text-white shrink-0">เชื่อมต่อ</a>
        </div>
      )}

      {/* Toolbar */}
      <div className={`${card} border ${border} rounded-xl px-4 py-3 flex flex-wrap items-center gap-3`}>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub}`} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..." className={`w-full h-9 pl-8 pr-3 rounded-lg text-sm border ${isDark ? "bg-white/[0.03] border-white/[0.06] text-white placeholder-white/30" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"} focus:outline-none`} />
        </div>
        <div className="flex gap-1">
          {[{ v: "all", l: "ทั้งหมด" }, { v: "receipt", l: "ใบเสร็จ" }, { v: "image", l: "รูปภาพ" }, { v: "pdf", l: "PDF" }, { v: "file", l: "ไฟล์อื่น" }].map((f) => (
            <button key={f.v} onClick={() => setFilterType(f.v)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterType === f.v ? "bg-[#FA3633] text-white" : isDark ? "bg-white/5 text-white/50 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{f.l}</button>
          ))}
        </div>
        <div className={`flex rounded-lg overflow-hidden border ${border}`}>
          <button onClick={() => setView("grid")} className={`p-2 transition-colors ${view === "grid" ? "bg-[#FA3633] text-white" : isDark ? "text-white/40 hover:bg-white/5" : "text-gray-400 hover:bg-gray-100"}`}><Grid3X3 size={14} /></button>
          <button onClick={() => setView("list")} className={`p-2 transition-colors ${view === "list" ? "bg-[#FA3633] text-white" : isDark ? "text-white/40 hover:bg-white/5" : "text-gray-400 hover:bg-gray-100"}`}><List size={14} /></button>
        </div>
      </div>

      {/* Drop zone when empty */}
      {filtered.length === 0 ? (
        <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${isDark ? "border-white/10 hover:border-white/20" : "border-gray-300 hover:border-gray-400"}`}>
          <Upload size={40} className={`mx-auto mb-3 ${muted}`} />
          <p className={`text-sm ${sub}`}>ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด</p>
          <p className={`text-xs ${muted} mt-1`}>รองรับ รูปภาพ, PDF, Excel, Word และอื่นๆ (สูงสุด 15MB)</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((doc) => {
            const fi = getFileIcon(doc.mimeType);
            return (
              <div key={doc._id} className={`${card} border ${border} rounded-xl overflow-hidden group cursor-pointer transition-all hover:shadow-lg ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-gray-50"}`} onClick={() => handleView(doc)}>
                <div className="aspect-[4/3] overflow-hidden relative">
                  <Thumb doc={doc} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Eye size={18} className="text-white" />
                  </div>
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {doc.fileType === "receipt" && doc.direction && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white leading-none" style={{ backgroundColor: DIR_CLR[doc.direction] || "#94A3B8" }}>{DIR_LABEL[doc.direction] || ""}</span>}
                    {doc.fileType === "file" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white leading-none" style={{ backgroundColor: fi.color }}>{fi.label}</span>}
                  </div>
                  {/* Delete */}
                  {doc.fileType === "file" && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(doc._id, "file"); }} className="absolute top-2 right-2 p-1 rounded-md bg-black/40 text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  )}
                </div>
                <div className="p-3">
                  <p className={`text-xs font-medium ${txt} truncate`}>{doc.name}</p>
                  <div className={`flex items-center justify-between mt-1`}>
                    <span className={`text-[10px] ${muted}`}>{doc.date}</span>
                    {doc.amount > 0 ? <span className={`text-[10px] font-semibold ${txt}`}>฿{doc.amount.toLocaleString()}</span> : <span className={`text-[10px] ${muted}`}>{formatSize(doc.size)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Upload card */}
          <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center min-h-[160px] cursor-pointer transition-colors ${isDark ? "border-white/10 hover:border-white/20 text-white/30 hover:text-white/50" : "border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500"}`}>
            <Upload size={24} className="mb-1" />
            <span className="text-xs font-medium">อัปโหลด</span>
          </div>
        </div>
      ) : (
        <div className={`${card} border ${border} rounded-2xl`}>
          {filtered.map((doc, i) => {
            const fi = getFileIcon(doc.mimeType);
            const Icon = fi.icon;
            return (
              <div key={doc._id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? `border-t ${border}` : ""} ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50"} transition-colors cursor-pointer group`} onClick={() => handleView(doc)}>
                <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                  {(doc.hasImage || doc.mimeType.startsWith("image/")) ? <Thumb doc={doc} /> : <Icon size={18} style={{ color: fi.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${txt} truncate`}>{doc.name}</span>
                    {doc.fileType === "receipt" && doc.direction && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white leading-none shrink-0" style={{ backgroundColor: DIR_CLR[doc.direction] }}>{DIR_LABEL[doc.direction]}</span>}
                    {doc.fileType === "file" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold leading-none shrink-0" style={{ backgroundColor: fi.color + "20", color: fi.color }}>{fi.label}</span>}
                  </div>
                  <div className={`flex items-center gap-2 text-[11px] ${muted} mt-0.5`}>
                    <span>{doc.date}</span>
                    {doc.size > 0 && <><span>·</span><span>{formatSize(doc.size)}</span></>}
                    {doc.category && <><span>·</span><span>{doc.category}</span></>}
                    {doc.fileType === "receipt" && <><span>·</span><span className="flex items-center gap-1"><BrandIcon brand={doc.source === "line" ? "line" : "web"} size={12} />{doc.source === "line" ? "LINE" : "เว็บ"}</span></>}
                  </div>
                </div>
                {doc.amount > 0 && <span className={`text-sm font-semibold ${txt} shrink-0`}>฿{doc.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {doc.fileType === "file" && <button onClick={(e) => { e.stopPropagation(); handleDelete(doc._id, "file"); }} className={`p-1.5 rounded-lg ${isDark ? "hover:bg-white/5 text-white/30 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}><Trash2 size={13} /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
