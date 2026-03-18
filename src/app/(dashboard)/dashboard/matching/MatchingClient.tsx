"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Upload, Loader2, ArrowRight, Check, X,
  Mail, Clock, Paperclip, Download, CheckCircle2, AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface FileInfo { name: string; type: string; size: number; }

interface ReceiptRow {
  _id: string; storeName: string; amount: number; category: string;
  date: string; rawDate?: string; time?: string; status: string;
  type: string; source: string; paymentMethod?: string; note?: string;
  hasImage?: boolean; direction?: string; createdAt?: string;
  emailSubject?: string; emailFrom?: string; emailAccount?: string; ocrConfidence?: number;
  fileIds?: string[]; files?: FileInfo[];
}

interface MatchRow {
  _id: string;
  receiptA: ReceiptRow;
  receiptB: ReceiptRow;
  matchScore: number; matchType: string; matchReason: string; status: string;
}

interface GoogleAccountInfo { _id: string; email: string; lastScanAt: string | null; autoScan: boolean; }

interface GmailSettings {
  connected: boolean; email: string | null;
  lastGmailScan: string | null; autoGmailScan: boolean;
  accounts?: GoogleAccountInfo[];
}

function Baht({ value }: { value: number }) {
  if (!value) return <span className="opacity-30">-</span>;
  const whole = Math.floor(Math.abs(value)).toLocaleString();
  const dec = (Math.abs(value) % 1).toFixed(2).slice(1);
  return <span className="font-semibold">฿{whole}<span className="text-[0.75em] opacity-50">{dec}</span></span>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

export default function MatchingClient({
  receipts, matches: initialMatches, gmailSettings,
}: {
  receipts: ReceiptRow[];
  matches: MatchRow[];
  gmailSettings: GmailSettings;
}) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState(initialMatches);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(gmailSettings.lastGmailScan);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bg = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const bd = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const dim = isDark ? "text-white/25" : "text-gray-300";

  const emailDocs = receipts.filter((r) => r.source === "email");
  const lineDocs = receipts.filter((r) => r.source === "line");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  // Unique email accounts
  const emailAccounts = [...new Set(emailDocs.map((r) => r.emailAccount).filter(Boolean))];
  const filteredEmailDocs = accountFilter === "all" ? emailDocs : emailDocs.filter((r) => r.emailAccount === accountFilter);
  const pendingMatches = matches.filter((m) => m.status === "pending");
  const confirmedMatches = matches.filter((m) => m.status === "matched");

  // Upload slip
  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      if (res.ok) setTimeout(() => router.refresh(), 500);
      else alert("อัปโหลดไม่สำเร็จ");
    } catch { alert("เกิดข้อผิดพลาด"); }
    finally { setUploading(false); }
  }, [router]);

  // Gmail scan
  const handleGmail = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/gmail/scan", { method: "POST" });
      const json = await res.json();
      if (json.expired) { window.location.href = "/api/auth/google"; return; }
      if (json.error) { alert(json.error); return; }
      setLastScan(new Date().toISOString());
      router.refresh();
    } catch { alert("เกิดข้อผิดพลาด"); }
    finally { setScanning(false); }
  };

  // Match action
  const handleAction = async (id: string, status: "matched" | "rejected") => {
    await fetch("/api/matches", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setMatches((prev) => prev.map((m) => m._id === id ? { ...m, status } : m));
  };

  // Helper: get receipt info
  const getReceipt = (id: string) => receipts.find((r) => r._id === id);

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(handleUpload); e.target.value = ""; }} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="สแกน & จับคู่" description="เปรียบเทียบสลิปจาก LINE กับเอกสารจากอีเมล" />
        <div className="flex gap-2">
          <button onClick={handleGmail} disabled={scanning || !gmailSettings.connected} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 ${isDark ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <BrandIcon brand="gmail" size={14} />}
            {scanning ? "สแกน..." : "ดึงจาก Gmail"}
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] disabled:opacity-40">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            อัปโหลดสลิป
          </button>
        </div>
      </div>

      {/* Gmail status - one line */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${bg} ${bd}`}>
        <BrandIcon brand="gmail" size={14} />
        {gmailSettings.connected ? (
          <>
            <span className={`text-sm ${txt}`}>{gmailSettings.email}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-400">เชื่อมแล้ว</span>
            {lastScan && <span className={`text-[11px] ${sub}`}><Clock size={10} className="inline mr-1" />สแกนล่าสุด {timeAgo(lastScan)}</span>}
            <a href="/api/auth/google" className={`ml-auto text-[11px] ${sub} hover:text-blue-400`}>+ เพิ่มบัญชี</a>
          </>
        ) : (
          <>
            <span className={`text-sm ${sub}`}>ยังไม่ได้เชื่อมต่อ Gmail</span>
            <a href="/api/auth/google" className="ml-auto text-sm font-medium text-blue-400 hover:underline">เชื่อมต่อ</a>
          </>
        )}
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "สลิป LINE", value: lineDocs.length, color: "text-green-500", icon: "line" },
          { label: "จาก Email", value: emailDocs.length, color: "text-red-400", icon: "gmail" },
          { label: "จับคู่แล้ว", value: confirmedMatches.length, color: "text-emerald-500", icon: null },
          { label: "รอยืนยัน", value: pendingMatches.length, color: "text-amber-500", icon: null },
        ].map((s) => (
          <div key={s.label} className={`${bg} border ${bd} rounded-xl px-4 py-3 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className={`text-[11px] mt-0.5 ${sub}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ===== MAIN: Match Pairs as Cards ===== */}
      {(pendingMatches.length > 0 || confirmedMatches.length > 0) && (
        <div>
          <h2 className={`text-lg font-semibold mb-3 ${txt}`}>คู่เอกสารที่จับคู่ได้</h2>
          <div className="space-y-3">
            {/* Pending first, then confirmed */}
            {[...pendingMatches, ...confirmedMatches].map((m) => {
              const receiptA = getReceipt(m.receiptA._id);
              const receiptB = getReceipt(m.receiptB._id);
              // Determine which is "doc A" (email/left) and "doc B" (slip/right)
              const isEmailA = receiptA?.source === "email";
              const isEmailB = receiptB?.source === "email";
              // If both same source, just use A/B as-is
              const leftDoc = isEmailA ? m.receiptA : isEmailB ? m.receiptB : m.receiptA;
              const rightDoc = isEmailA ? m.receiptB : isEmailB ? m.receiptA : m.receiptB;
              const leftReceipt = getReceipt(leftDoc._id);
              const rightReceipt = getReceipt(rightDoc._id);
              const leftSource = leftReceipt?.source || "email";
              const rightSource = rightReceipt?.source || "line";
              const emailDoc = leftDoc;
              const slipDoc = rightDoc;
              const slipReceipt = rightReceipt;
              const emailReceipt = leftReceipt;
              const fileId = emailReceipt?.fileIds?.[0];
              const scoreColor = m.matchScore >= 80 ? "text-green-500 border-green-500/30 bg-green-500/5" : m.matchScore >= 50 ? "text-amber-500 border-amber-500/30 bg-amber-500/5" : "text-red-400 border-red-400/30 bg-red-400/5";

              return (
                <div key={m._id} className={`border rounded-2xl p-4 ${bg} ${bd} ${m.status === "matched" ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3">

                    {/* Left: Email doc */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-medium mb-1.5 ${sub}`}>
                        <BrandIcon brand={leftSource === "line" ? "line" : leftSource === "email" ? "gmail" : "web"} size={10} /> {leftSource === "email" ? "เอกสารจากอีเมล" : leftSource === "line" ? "สลิปจาก LINE" : "เอกสาร A"}
                      </div>
                      <div className="flex items-center gap-2.5">
                        {fileId ? (
                          <a href={`/api/files/download?id=${fileId}`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                            <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-gray-200 bg-gray-50 hover:bg-gray-100"} transition-colors`}>
                              <Paperclip size={16} className="text-blue-400" />
                            </div>
                          </a>
                        ) : (
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                            <Mail size={16} className={sub} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${txt}`}>{emailDoc.storeName}</p>
                          <p className={`text-xs ${sub}`}><Baht value={emailDoc.amount} /></p>
                          {emailReceipt?.emailSubject && emailReceipt.emailSubject !== emailDoc.storeName && (
                            <p className={`text-[10px] truncate ${dim}`}>{emailReceipt.emailSubject}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Score */}
                    <div className="flex flex-col items-center gap-1 px-3">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm ${scoreColor}`}>
                        {m.matchScore}%
                      </div>
                      <ArrowRight size={10} className={dim} />
                    </div>

                    {/* Right: Slip */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-medium mb-1.5 ${sub}`}>
                        <BrandIcon brand={rightSource === "line" ? "line" : rightSource === "email" ? "gmail" : "web"} size={10} /> {rightSource === "line" ? "สลิปจาก LINE" : rightSource === "email" ? "เอกสารจากอีเมล" : "เอกสาร B"}
                      </div>
                      <div className="flex items-center gap-2.5">
                        {slipReceipt?.hasImage ? (
                          <img src={`/api/receipts/image?id=${slipDoc._id}`} alt="" className={`w-12 h-12 rounded-lg object-cover border ${isDark ? "border-white/10" : "border-gray-200"}`} loading="lazy" />
                        ) : slipReceipt?.fileIds?.[0] ? (
                          <a href={`/api/files/download?id=${slipReceipt.fileIds[0]}`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                            <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-gray-200 bg-gray-50 hover:bg-gray-100"} transition-colors`}>
                              <Paperclip size={16} className="text-blue-400" />
                            </div>
                          </a>
                        ) : (
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                            <BrandIcon brand={rightSource === "line" ? "line" : rightSource === "email" ? "gmail" : "web"} size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${txt}`}>{slipDoc.storeName}</p>
                          <p className={`text-xs ${sub}`}><Baht value={slipDoc.amount} /></p>
                          {slipReceipt?.date && <p className={`text-[10px] ${dim}`}>{slipReceipt.date}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 pl-2">
                      {m.status === "pending" ? (
                        <div className="flex flex-col gap-1.5">
                          <button onClick={() => handleAction(m._id, "matched")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors">
                            <Check size={12} /> ยืนยัน
                          </button>
                          <button onClick={() => handleAction(m._id, "rejected")} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? "bg-white/5 text-white/30 hover:bg-white/10" : "bg-gray-100 text-gray-400 hover:bg-gray-200"} transition-colors`}>
                            <X size={12} /> ปฏิเสธ
                          </button>
                        </div>
                      ) : m.status === "matched" ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400">
                          <CheckCircle2 size={10} /> ตรงกัน
                        </span>
                      ) : (
                        <span className={`text-[10px] ${dim}`}>ปฏิเสธแล้ว</span>
                      )}
                    </div>
                  </div>

                  {/* Match reason */}
                  {m.matchReason && (
                    <p className={`text-[10px] mt-2 pt-2 border-t ${isDark ? "border-white/5" : "border-gray-100"} ${dim}`}>
                      เหตุผล: {m.matchReason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for matches */}
      {pendingMatches.length === 0 && confirmedMatches.length === 0 && (
        <div className={`border rounded-2xl p-8 text-center ${bg} ${bd}`}>
          <AlertCircle size={32} className={`mx-auto mb-3 ${dim}`} />
          <p className={`font-medium ${txt}`}>ยังไม่มีคู่เอกสาร</p>
          <p className={`text-sm mt-1 ${sub}`}>ส่งสลิปผ่าน LINE แล้วกด &quot;ดึงจาก Gmail&quot; เพื่อเริ่มจับคู่อัตโนมัติ</p>
        </div>
      )}

      {/* ===== Email documents list ===== */}
      {emailDocs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-lg font-semibold ${txt}`}>เอกสารจากอีเมล ({filteredEmailDocs.length})</h2>
            {emailAccounts.length > 1 && (
              <div className="flex gap-1.5">
                <button onClick={() => setAccountFilter("all")} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${accountFilter === "all" ? "bg-[#FA3633] text-white" : `${isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500"}`}`}>
                  ทั้งหมด
                </button>
                {emailAccounts.map((acc) => (
                  <button key={acc} onClick={() => setAccountFilter(acc!)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${accountFilter === acc ? "bg-[#FA3633] text-white" : `${isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500"}`}`}>
                    {acc}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            {filteredEmailDocs.map((r) => {
              const match = matches.find((m) => (m.receiptA._id === r._id || m.receiptB._id === r._id) && m.status === "matched");
              const fileId = r.fileIds?.[0];
              return (
                <div key={r._id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg} ${bd}`}>
                  {/* Icon/PDF */}
                  {fileId ? (
                    <a href={`/api/files/download?id=${fileId}`} target="_blank" rel="noopener" className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-gray-200 bg-gray-50 hover:bg-gray-100"} transition-colors`}>
                      <Download size={12} className="text-blue-400" />
                    </a>
                  ) : (
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                      <Mail size={12} className={sub} />
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${txt}`}>{r.emailSubject || r.storeName}</p>
                    <div className={`flex items-center gap-2 text-[11px] ${sub}`}>
                      {r.emailFrom && <span>{r.emailFrom}</span>}
                      {r.date && <span>{r.date}</span>}
                      {emailAccounts.length > 1 && r.emailAccount && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400"}`}>{r.emailAccount}</span>
                      )}
                    </div>
                  </div>
                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <Baht value={r.amount} />
                  </div>
                  {/* Match status */}
                  <div className="flex-shrink-0 w-20 text-right">
                    {match ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-400">จับคู่แล้ว</span>
                    ) : r.amount > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-400">รอจับคู่</span>
                    ) : (
                      <span className={`text-[10px] ${dim}`}>-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== LINE slips list ===== */}
      {lineDocs.length > 0 && (
        <div>
          <h2 className={`text-lg font-semibold mb-3 ${txt}`}>สลิปจาก LINE ({lineDocs.length})</h2>
          <div className="space-y-2">
            {lineDocs.slice(0, 10).map((r) => {
              const match = matches.find((m) => (m.receiptA._id === r._id || m.receiptB._id === r._id) && m.status === "matched");
              return (
                <div key={r._id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg} ${bd}`}>
                  {/* Thumbnail */}
                  {r.hasImage ? (
                    <img src={`/api/receipts/image?id=${r._id}`} alt="" className={`w-9 h-9 rounded-lg object-cover flex-shrink-0 border ${isDark ? "border-white/10" : "border-gray-200"}`} loading="lazy" />
                  ) : (
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                      <BrandIcon brand="line" size={12} />
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${txt}`}>{r.storeName}</p>
                    <div className={`flex items-center gap-2 text-[11px] ${sub}`}>
                      <span>{r.date}</span>
                      {r.time && <span>{r.time}</span>}
                    </div>
                  </div>
                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <Baht value={r.amount} />
                  </div>
                  {/* Match status */}
                  <div className="flex-shrink-0 w-20 text-right">
                    {match ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-400">จับคู่แล้ว</span>
                    ) : (
                      <span className={`text-[10px] ${dim}`}>รอ</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
