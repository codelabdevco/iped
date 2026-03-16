"use client";

import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ExportPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const url = `/api/export?format=${format}&start=${startDate}&end=${endDate}`;
      const res = await fetch(url);

      if (!res.ok) {
        alert("เกิดข้อผิดพลาดในการส่งออก");
        return;
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `iped-export-${startDate}-to-${endDate}.${format}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ส่งออกข้อมูล</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">เลือกช่วงเวลาและรูปแบบ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">วันเริ่มต้น</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">วันสิ้นสุด</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">รูปแบบไฟล์</label>
              <div className="flex gap-3">
                <Button
                  variant={format === "csv" ? "default" : "outline"}
                  onClick={() => setFormat("csv")}
                >
                  📊 CSV (Excel)
                </Button>
                <Button
                  variant={format === "json" ? "default" : "outline"}
                  onClick={() => setFormat("json")}
                >
                  📋 JSON
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={handleExport} disabled={loading}>
              {loading ? "กำลังส่งออก..." : "⬇️ ดาวน์โหลด"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
