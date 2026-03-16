"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/shared/Navbar";
import UploadZone from "@/components/shared/UploadZone";
import ReceiptForm, { ReceiptData } from "@/components/shared/ReceiptForm";
import ReceiptList from "@/components/shared/ReceiptList";
import StatsCards from "@/components/shared/StatsCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<ReceiptData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [imageHash, setImageHash] = useState<string>("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState("");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalToday: 0, totalMonth: 0, countToday: 0, countMonth: 0, budget: 50000 });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchReceipts = useCallback(async () => {
    try {
      const res = await fetch("/api/receipts");
      const data = await res.json();
      setReceipts(data.receipts || []);
      setStats(data.stats || stats);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setSaveSuccess(false);
    setIsDuplicate(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setOcrResult(data.data);
        setImagePreview(data.data.imageUrl);
        setImageHash(data.data.imageHash || "");
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async (data: ReceiptData) => {
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, imageHash, source: "web" }),
      });

      const result = await res.json();

      if (result.duplicate) {
        setIsDuplicate(true);
        setDuplicateInfo(result.duplicateInfo);
        return;
      }

      if (result.success) {
        setOcrResult(null);
        setImagePreview(undefined);
        setImageHash("");
        setSaveSuccess(true);
        fetchReceipts();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleCancel = () => {
    setOcrResult(null);
    setImagePreview(undefined);
    setImageHash("");
    setIsDuplicate(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Success Message */}
        {saveSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-in fade-in">
            <span className="text-lg">✅</span>
            <span className="text-green-800 font-medium">บันทึกใบเสร็จเรียบร้อยแล้ว</span>
          </div>
        )}

        {/* Upload or Edit */}
        <div className="mt-6">
          {ocrResult ? (
            <ReceiptForm data={ocrResult} imagePreview={imagePreview} isDuplicate={isDuplicate} duplicateInfo={duplicateInfo} onConfirm={handleConfirm} onCancel={handleCancel} />
          ) : (
            <UploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
          )}
        </div>

        {/* Recent Receipts */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">รายการล่าสุด</h2>
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/history")}>
              ดูทั้งหมด →
            </Button>
          </div>
          <ReceiptList receipts={receipts.slice(0, 5)} />
        </div>
      </main>
    </div>
  );
}
