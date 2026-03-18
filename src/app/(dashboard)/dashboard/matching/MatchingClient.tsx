"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Upload, Loader2, Check, X, Mail, Clock, ChevronDown, Paperclip, Download } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface FileInfo { name: string; type: string; size: number; }
interface ReceiptRow {
  _id: string; storeName: string; amount: number; category: string;
  date: string; rawDate?: string; time?: string; status: string;
  source: string; hasImage?: boolean; emailSubject?: string;
  emailFrom?: string; emailAccount?: string; ocrConfidence?: number;
  fileIds?: string[]; files?: FileInfo[];
  [key: string]: any;
}
interface MatchRow {
  _id: string; receiptA: ReceiptRow; receiptB: ReceiptRow;
  matchScore: number; matchType: string; matchReason: string; status: string;
}
interface GmailSettings {
  connected: boolean; email: string | null;
  lastGmailScan: string | null; autoGmailScan: boolean;
  accounts?: any[];
}

function Baht({ value }: { value: number }) {
  if (!value) return <span className="opacity-30">฿0</span>;
  return <span className="font-semibold">฿{Math.floor(value).toLocaleString()}<span className="text-[0.75em] opacity-50">.{(value % 1).toFixed(2).slice(2)}</span></span>;
}

function timeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

export default function MatchingClient({ receipts, matches: initMatches, gmailSettings }: {
  receipts: ReceiptRow[]; matches: MatchRow[]; gmailSettings: GmailSettings;
}) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState(initMatches);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(gmailSettings.lastGmailScan);
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null); // receipt _id to view full image
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Colors
  const bg = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const bd = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const dim = isDark ? "text-white/25" : "text-gray-300";

  // Calculate match score between email and slip
  const calcScore = (email: ReceiptRow, slip: ReceiptRow): number => {
    let score = 0;
    // Amount similarity
    if (email.amount > 0 && slip.amount > 0) {
      const diff = Math.abs(email.amount - slip.amount) / Math.max(email.amount, slip.amount);
      if (diff === 0) score += 50;
      else if (diff < 0.05) score += 40;
      else if (diff < 0.1) score += 30;
      else if (diff < 0.2) score += 15;
    }
    // Date proximity
    if (email.rawDate && slip.rawDate) {
      const days = Math.abs(new Date(email.rawDate).getTime() - new Date(slip.rawDate).getTime()) / 86400000;
      if (days === 0) score += 30;
      else if (days <= 1) score += 25;
      else if (days <= 3) score += 15;
      else if (days <= 7) score += 5;
    }
    // Name similarity (basic)
    const a = (email.storeName || "").toLowerCase();
    const b = (slip.storeName || "").toLowerCase();
    if (a && b && (a.includes(b) || b.includes(a))) score += 20;
    return Math.min(score, 100);
  };

  // Data
  const emailDocs = receipts.filter((r) => r.source === "email");
  const lineDocs = receipts.filter((r) => r.source === "line" || r.source === "web");

  // Find match for a receipt
  const getMatch = (id: string) => matches.find((m) =>
    (m.receiptA._id === id || m.receiptB._id === id) && m.status === "matched"
  );
  const getMatchedSlip = (emailId: string) => {
    const m = getMatch(emailId);
    if (!m) return null;
    const otherId = m.receiptA._id === emailId ? m.receiptB._id : m.receiptA._id;
    return receipts.find((r) => r._id === otherId) || null;
  };

  // Actions
  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      if (res.ok) setTimeout(() => router.refresh(), 500);
    } catch {} finally { setUploading(false); }
  }, [router]);

  const handleGmail = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/gmail/scan", { method: "POST" });
      const json = await res.json();
      if (json.expired) { window.location.href = "/api/auth/google"; return; }
      if (json.error) { alert(json.error); return; }
      setLastScan(new Date().toISOString());
      router.refresh();
    } catch { alert("เกิดข้อผิดพลาด"); } finally { setScanning(false); }
  };

  const handlePair = async (emailId: string, slipId: string) => {
    try {
      const res = await fetch("/api/matches/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptA: emailId, receiptB: slipId }),
      });
      if (res.ok) {
        const json = await res.json();
        const emailR = receipts.find((r) => r._id === emailId);
        const slipR = receipts.find((r) => r._id === slipId);
        setMatches((prev) => [{
          _id: json.match?._id || `m-${Date.now()}`,
          receiptA: emailR || { _id: emailId, storeName: "?" } as any,
          receiptB: slipR || { _id: slipId, storeName: "?" } as any,
          matchScore: 100, matchType: "manual", matchReason: "จับคู่ด้วยตนเอง", status: "matched",
        }, ...prev]);
      } else {
        const json = await res.json();
        alert(json.error || "เกิดข้อผิดพลาด");
      }
    } catch { alert("เกิดข้อผิดพลาด"); }
    setPickingFor(null);
  };

  const handleUnmatch = async (matchId: string) => {
    await fetch("/api/matches", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchId, status: "rejected" }),
    });
    setMatches((prev) => prev.filter((m) => m._id !== matchId));
  };

  const matched = matches.filter((m) => m.status === "matched").length;

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(handleUpload); e.target.value = ""; }} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="ตรวจสอบเอกสาร" description="จับคู่เอกสารจากอีเมลกับสลิปในระบบ" />
        <div className="flex gap-2">
          <button onClick={handleGmail} disabled={scanning || !gmailSettings.connected} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 ${isDark ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <BrandIcon brand="gmail" size={14} />}
            {scanning ? "กำลังดึง..." : "ดึงจาก Gmail"}
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] disabled:opacity-40">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            อัปโหลดสลิป
          </button>
        </div>
      </div>

      {/* Gmail status */}
      {gmailSettings.connected ? (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${bg} ${bd}`}>
          <BrandIcon brand="gmail" size={14} />
          <span className={`text-sm ${txt}`}>{gmailSettings.email}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-400">เชื่อมแล้ว</span>
          {lastScan && <span className={`text-[11px] ${sub}`}><Clock size={10} className="inline mr-1" />{timeAgo(lastScan)}</span>}
          <a href="/api/auth/google" className={`ml-auto text-[11px] ${sub} hover:text-blue-400`}>+ เพิ่มบัญชี</a>
        </div>
      ) : (
        <a href="/api/auth/google" className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg} ${bd} hover:border-blue-400/30 transition-colors`}>
          <Mail size={16} className={sub} />
          <span className={sub}>เชื่อมต่อ Gmail เพื่อดึงใบเสร็จจากอีเมล</span>
          <span className="ml-auto text-sm font-medium text-blue-400">เชื่อมต่อ</span>
        </a>
      )}

      {/* Summary */}
      <div className="flex gap-4">
        <div className={`flex-1 rounded-xl border px-4 py-3 ${bg} ${bd}`}>
          <span className={`text-2xl font-bold text-green-500`}>{lineDocs.length}</span>
          <span className={`text-sm ml-2 ${sub}`}>สลิปในระบบ</span>
        </div>
        <div className={`flex-1 rounded-xl border px-4 py-3 ${bg} ${bd}`}>
          <span className={`text-2xl font-bold text-red-400`}>{emailDocs.length}</span>
          <span className={`text-sm ml-2 ${sub}`}>จากอีเมล</span>
        </div>
        <div className={`flex-1 rounded-xl border px-4 py-3 ${bg} ${bd}`}>
          <span className={`text-2xl font-bold text-emerald-500`}>{matched}</span>
          <span className={`text-sm ml-2 ${sub}`}>จับคู่แล้ว</span>
        </div>
      </div>

      {/* ===== MAIN LIST: Each email doc = 1 row ===== */}
      {emailDocs.length > 0 ? (
        <div>
          <h2 className={`font-semibold mb-3 ${txt}`}>เอกสารจากอีเมล</h2>
          <div className="space-y-2">
            {emailDocs.map((email) => {
              const matchedSlip = getMatchedSlip(email._id);
              const match = getMatch(email._id);
              const fileId = email.fileIds?.[0];
              const isPicking = pickingFor === email._id;

              return (
                <div key={email._id}>
                  <div className={`rounded-xl border px-4 py-3 ${bg} ${bd} ${isPicking ? (isDark ? "ring-1 ring-[#FA3633]/40" : "ring-1 ring-[#FA3633]/30") : ""}`}>
                    <div className="flex items-center gap-3">
                      {/* PDF icon */}
                      {fileId ? (
                        <a href={`/api/files/download?id=${fileId}`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 hover:opacity-80 ${isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
                          <Download size={14} className="text-blue-400" />
                        </a>
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                          <Mail size={14} className={sub} />
                        </div>
                      )}

                      {/* Email info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${txt}`}>{email.emailSubject || email.storeName}</p>
                        <p className={`text-[11px] truncate ${dim}`}>{email.emailFrom} · {email.date}</p>
                      </div>

                      {/* Amount */}
                      <div className="flex-shrink-0 text-right w-24">
                        <Baht value={email.amount} />
                      </div>

                      {/* Match status / action */}
                      <div className="flex-shrink-0 w-44">
                        {matchedSlip ? (
                          /* Already matched — show the paired slip */
                          <div className="flex items-center gap-2">
                            {matchedSlip.hasImage && (
                              <img src={`/api/receipts/image?id=${matchedSlip._id}`} alt="" className={`w-8 h-8 rounded object-cover border ${isDark ? "border-white/10" : "border-gray-200"}`} loading="lazy" />
                            )}
                            <div className="min-w-0">
                              <p className={`text-[11px] font-medium truncate ${txt}`}>{matchedSlip.storeName}</p>
                              <p className="text-[10px] text-green-400">จับคู่แล้ว</p>
                            </div>
                            <button onClick={() => match && handleUnmatch(match._id)} className={`p-1 rounded ${isDark ? "hover:bg-white/5 text-white/20" : "hover:bg-gray-100 text-gray-300"}`} title="ยกเลิกจับคู่">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          /* Not matched — show pick button */
                          <button
                            onClick={() => setPickingFor(isPicking ? null : email._id)}
                            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isPicking
                                ? "bg-[#FA3633] text-white"
                                : isDark ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {isPicking ? "ยกเลิก" : <><ChevronDown size={12} /> เลือกสลิปจับคู่</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Slip picker dropdown — larger cards with score */}
                  {isPicking && (
                    <div className={`mt-1 rounded-xl border p-4 ${isDark ? "bg-[rgba(255,255,255,0.06)] border-[#FA3633]/20" : "bg-gray-50 border-[#FA3633]/10"}`}>
                      <p className={`text-xs font-medium mb-3 ${sub}`}>เลือกสลิปที่ตรงกับเอกสารนี้ (กดรูปเพื่อดูขนาดใหญ่):</p>
                      {lineDocs.length === 0 ? (
                        <p className={`text-sm ${dim}`}>ยังไม่มีสลิปในระบบ — ส่งสลิปผ่าน LINE ก่อน</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                          {[...lineDocs]
                            .map((slip) => ({ slip, score: calcScore(email, slip) }))
                            .sort((a, b) => b.score - a.score)
                            .map(({ slip, score }) => {
                            const alreadyMatched = getMatch(slip._id);
                            const scoreColor = score >= 50 ? "text-green-400 bg-green-500/10" : score >= 20 ? "text-amber-400 bg-amber-500/10" : `${dim} ${isDark ? "bg-white/5" : "bg-gray-100"}`;
                            return (
                              <div
                                key={slip._id}
                                className={`rounded-xl border p-3 transition-colors ${
                                  alreadyMatched
                                    ? `opacity-25 cursor-not-allowed ${isDark ? "border-white/5" : "border-gray-200"}`
                                    : isDark ? "border-white/10 hover:border-green-500/40 hover:bg-green-500/5" : "border-gray-200 hover:border-green-500/30 hover:bg-green-50"
                                }`}
                              >
                                {/* Slip image — clickable to enlarge */}
                                <div className="relative mb-2">
                                  {slip.hasImage ? (
                                    <img
                                      src={`/api/receipts/image?id=${slip._id}`}
                                      alt=""
                                      className={`w-full h-32 rounded-lg object-cover border cursor-pointer ${isDark ? "border-white/10" : "border-gray-200"}`}
                                      loading="lazy"
                                      onClick={(e) => { e.stopPropagation(); setViewImage(slip._id); }}
                                    />
                                  ) : (
                                    <div className={`w-full h-32 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                                      <BrandIcon brand="line" size={24} />
                                    </div>
                                  )}
                                  {/* Score badge */}
                                  {score > 0 && (
                                    <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${scoreColor}`}>
                                      {score}%
                                    </span>
                                  )}
                                </div>
                                {/* Slip info + pair button */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className={`text-xs font-medium truncate ${txt}`}>{slip.storeName}</p>
                                    <p className={`text-[10px] ${dim}`}>{slip.date} · <Baht value={slip.amount} /></p>
                                  </div>
                                  {!alreadyMatched && (
                                    <button
                                      onClick={() => handlePair(email._id, slip._id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20 flex-shrink-0 transition-colors"
                                    >
                                      <Check size={11} /> จับคู่
                                    </button>
                                  )}
                                  {alreadyMatched && <span className={`text-[10px] ${dim}`}>จับคู่แล้ว</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`rounded-xl border p-8 text-center ${bg} ${bd}`}>
          <Mail size={32} className={`mx-auto mb-3 ${dim}`} />
          <p className={`font-medium ${txt}`}>ยังไม่มีเอกสารจากอีเมล</p>
          <p className={`text-sm mt-1 ${sub}`}>กดปุ่ม &quot;ดึงจาก Gmail&quot; เพื่อดึงใบเสร็จ/ใบแจ้งหนี้จากอีเมล</p>
        </div>
      )}

      {/* LINE slips */}
      {lineDocs.length > 0 && (
        <div>
          <h2 className={`font-semibold mb-3 ${txt}`}>สลิปในระบบ ({lineDocs.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {lineDocs.map((slip) => {
              const isMatched = !!getMatch(slip._id);
              return (
                <div key={slip._id} className={`rounded-xl border p-2 text-center ${bg} ${bd} ${isMatched ? "opacity-50" : ""}`}>
                  {slip.hasImage ? (
                    <img src={`/api/receipts/image?id=${slip._id}`} alt="" className={`w-full h-20 rounded-lg object-cover border mb-1.5 cursor-pointer hover:opacity-80 ${isDark ? "border-white/10" : "border-gray-200"}`} loading="lazy" onClick={() => setViewImage(slip._id)} />
                  ) : (
                    <div className={`w-full h-20 rounded-lg flex items-center justify-center mb-1.5 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                      <BrandIcon brand="line" size={20} />
                    </div>
                  )}
                  <p className={`text-[11px] font-medium truncate ${txt}`}>{slip.storeName}</p>
                  <p className={`text-[10px] ${sub}`}><Baht value={slip.amount} /></p>
                  {isMatched && <p className="text-[9px] text-green-400 mt-0.5">จับคู่แล้ว</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Image lightbox */}
      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setViewImage(null)}>
          <div className="relative max-w-lg max-h-[85vh] m-4" onClick={(e) => e.stopPropagation()}>
            <img src={`/api/receipts/image?id=${viewImage}`} alt="สลิป" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl" />
            <button onClick={() => setViewImage(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-gray-200">
              <X size={16} />
            </button>
            {/* Info bar */}
            {(() => {
              const r = receipts.find((r) => r._id === viewImage);
              return r ? (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm rounded-b-xl px-4 py-3 text-white">
                  <p className="font-medium">{r.storeName}</p>
                  <p className="text-sm opacity-70">{r.date} · <Baht value={r.amount} /></p>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
