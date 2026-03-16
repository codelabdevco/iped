"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export default function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <Card
      className={"border-2 border-dashed transition-all duration-200 cursor-pointer " + (isDragging ? "border-yellow-400 bg-yellow-50 scale-[1.02]" : "border-gray-300 hover:border-yellow-400/60 hover:bg-yellow-50/30") + " " + (isProcessing ? "opacity-60 pointer-events-none" : "")}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !isProcessing && document.getElementById("file-input")?.click()}
    >
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        {isProcessing ? (
          <>
            <div className="w-16 h-16 mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">กำลังอ่านใบเสร็จ...</p>
            <p className="text-sm text-muted-foreground mt-1">AI กำลังวิเคราะห์ข้อมูลจากรูปภาพ</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">อัปโหลดใบเสร็จ</p>
            <p className="text-sm text-muted-foreground mt-1">ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์</p>
            <p className="text-xs text-muted-foreground mt-2">รองรับ JPG, PNG, PDF ขนาดไม่เกิน 10MB</p>
            <Button className="mt-4 bg-black text-white hover:bg-gray-800" size="sm">
              เลือกไฟล์
            </Button>
          </>
        )}
        <input id="file-input" type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileInput} />
      </CardContent>
    </Card>
  );
}
