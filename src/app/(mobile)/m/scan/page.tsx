"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Camera, Image, Loader2, Check, X } from "lucide-react";

export default function MobileScanPage() {
  const { isDark } = useTheme();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.receipt) {
        setResult(data.receipt);
      } else {
        setError(data.error || "ไม่สามารถอ่านใบเสร็จได้");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setUploading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError("");
  };

  const fmt = (n: number) => n?.toLocaleString("th-TH", { minimumFractionDigits: 2 }) || "0.00";

  return (
    <div className="space-y-4 pt-2">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleInput} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleInput} className="hidden" />

      {/* Result */}
      {result && (
        <div className={`${card} border ${border} rounded-2xl p-5 space-y-3`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check size={16} className="text-green-500" />
            </div>
            <div>
              <p className={`text-sm font-bold ${txt}`}>บันทึกสำเร็จ</p>
              <p className={`text-xs ${sub}`}>{result.merchant}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${sub}`}>จำนวนเงิน</span>
            <span className={`text-lg font-bold ${result.direction === "income" ? "text-green-500" : "text-red-500"}`}>
              {result.direction === "income" ? "+" : "-"}฿{fmt(result.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${sub}`}>หมวดหมู่</span>
            <span className={`text-sm ${txt}`}>{result.categoryIcon} {result.category}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={reset} className="flex-1 py-3 rounded-xl bg-[#FA3633] text-white text-sm font-medium active:scale-[0.98]">สแกนอีก</button>
            <a href="/m/receipts" className={`flex-1 py-3 rounded-xl text-center text-sm font-medium ${isDark ? "bg-white/5 text-white" : "bg-gray-100 text-gray-700"}`}>ดูใบเสร็จ</a>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={`${card} border border-red-500/20 rounded-2xl p-5 text-center`}>
          <p className="text-red-500 font-medium text-sm">{error}</p>
          <button onClick={reset} className="mt-3 px-6 py-2 rounded-xl bg-[#FA3633] text-white text-sm font-medium">ลองใหม่</button>
        </div>
      )}

      {/* Uploading */}
      {uploading && (
        <div className={`${card} border ${border} rounded-2xl p-8 flex flex-col items-center gap-3`}>
          <Loader2 size={32} className="text-[#FA3633] animate-spin" />
          <p className={`text-sm ${txt}`}>กำลังอ่านใบเสร็จ...</p>
          <p className={`text-xs ${sub}`}>AI กำลังวิเคราะห์ข้อมูล</p>
        </div>
      )}

      {/* Preview */}
      {preview && !uploading && !result && !error && (
        <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
          <img src={preview} alt="preview" className="w-full max-h-64 object-contain" />
        </div>
      )}

      {/* Camera buttons */}
      {!uploading && !result && (
        <div className="space-y-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[#FA3633] text-white font-semibold text-base shadow-lg active:scale-[0.98] transition-transform"
          >
            <Camera size={24} />
            ถ่ายรูปใบเสร็จ
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl ${isDark ? "bg-white/5 text-white/70" : "bg-gray-100 text-gray-600"} font-medium text-sm active:scale-[0.98] transition-transform`}
          >
            <Image size={20} />
            เลือกจากอัลบั้ม
          </button>
        </div>
      )}

      {/* Tips */}
      {!uploading && !result && (
        <div className={`${card} border ${border} rounded-2xl p-4`}>
          <p className={`text-xs font-semibold ${sub} mb-2`}>เคล็ดลับ</p>
          <ul className={`text-xs ${isDark ? "text-white/30" : "text-gray-400"} space-y-1`}>
            <li>• วางใบเสร็จบนพื้นเรียบ</li>
            <li>• ถ่ายตรงๆ ไม่เอียง</li>
            <li>• แสงสว่างเพียงพอ</li>
            <li>• รองรับ: สลิป, ใบเสร็จ, ใบกำกับภาษี, บิล</li>
          </ul>
        </div>
      )}
    </div>
  );
}
