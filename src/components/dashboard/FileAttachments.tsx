"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Paperclip, X, FileText, FileSpreadsheet, Image as ImageIcon, File, Upload, Pencil } from "lucide-react";

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  note: string;
}

interface FileAttachmentsProps {
  files: Attachment[];
  onChange: (files: Attachment[]) => void;
}

const FILE_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  pdf: { icon: FileText, color: "text-red-400" },
  doc: { icon: FileText, color: "text-blue-400" },
  docx: { icon: FileText, color: "text-blue-400" },
  xls: { icon: FileSpreadsheet, color: "text-green-400" },
  xlsx: { icon: FileSpreadsheet, color: "text-green-400" },
  csv: { icon: FileSpreadsheet, color: "text-green-400" },
  png: { icon: ImageIcon, color: "text-purple-400" },
  jpg: { icon: ImageIcon, color: "text-purple-400" },
  jpeg: { icon: ImageIcon, color: "text-purple-400" },
  gif: { icon: ImageIcon, color: "text-purple-400" },
  webp: { icon: ImageIcon, color: "text-purple-400" },
};

function getFileInfo(type: string) {
  const ext = type.split("/").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || { icon: File, color: "text-white/40" };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

let idCounter = 0;

export default function FileAttachments({ files, onChange }: FileAttachmentsProps) {
  const { isDark } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");

  const border = isDark ? "border-white/10" : "border-gray-200";
  const sub = isDark ? "text-white/40" : "text-gray-400";
  const txt = isDark ? "text-white" : "text-gray-900";
  const inputCls = isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-200 text-gray-900";

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).map((f) => ({
      id: `file-${++idCounter}-${Date.now()}`,
      name: f.name,
      size: formatSize(f.size),
      type: f.type || f.name.split(".").pop() || "unknown",
      note: "",
    }));
    onChange([...files, ...newFiles]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  const startEdit = (f: Attachment) => {
    setEditingId(f.id);
    setEditName(f.name);
    setEditNote(f.note);
  };

  const saveEdit = () => {
    if (!editingId) return;
    onChange(files.map((f) => f.id === editingId ? { ...f, name: editName, note: editNote } : f));
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold ${isDark ? "text-white/50" : "text-gray-500"}`}>
          เอกสารแนบ ({files.length})
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
        >
          <Upload size={12} /> แนบไฟล์
        </button>
        <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.webp,.txt,.zip,.rar" onChange={handleAdd} className="hidden" />
      </div>

      {files.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed ${border} rounded-xl p-6 text-center cursor-pointer transition-colors ${isDark ? "hover:bg-white/3" : "hover:bg-gray-50"}`}
        >
          <Paperclip size={24} className={`mx-auto ${sub} mb-2`} />
          <p className={`text-xs ${sub}`}>คลิกเพื่อแนบไฟล์</p>
          <p className={`text-[10px] ${isDark ? "text-white/20" : "text-gray-300"} mt-1`}>PDF, Excel, Word, รูปภาพ, CSV, ZIP</p>
        </div>
      )}

      {files.map((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase() || "";
        const info = FILE_ICONS[ext] || { icon: File, color: isDark ? "text-white/40" : "text-gray-400" };
        const Icon = info.icon;
        const isEditing = editingId === f.id;

        return (
          <div key={f.id} className={`rounded-xl border ${border} ${isDark ? "bg-white/[0.02]" : "bg-gray-50/50"} overflow-hidden`}>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                <Icon size={16} className={info.color} />
              </div>

              {isEditing ? (
                <div className="flex-1 space-y-1.5">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className={`w-full h-7 px-2 ${inputCls} border rounded text-xs focus:outline-none focus:border-[#FA3633]/50`} placeholder="ชื่อไฟล์" />
                  <input value={editNote} onChange={(e) => setEditNote(e.target.value)} className={`w-full h-7 px-2 ${inputCls} border rounded text-xs focus:outline-none focus:border-[#FA3633]/50`} placeholder="หมายเหตุ (ไม่บังคับ)" />
                  <div className="flex gap-1">
                    <button onClick={saveEdit} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FA3633] text-white">บันทึก</button>
                    <button onClick={() => setEditingId(null)} className={`px-2 py-0.5 rounded text-[10px] font-medium ${isDark ? "bg-white/5 text-white/50" : "bg-gray-200 text-gray-500"}`}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${txt}`}>{f.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${sub}`}>{f.size}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400"}`}>{ext}</span>
                    {f.note && <span className={`text-[10px] ${isDark ? "text-blue-400/60" : "text-blue-500/60"}`}>📝 {f.note}</span>}
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => startEdit(f)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/30 hover:text-blue-400" : "hover:bg-gray-100 text-gray-300 hover:text-blue-500"}`}><Pencil size={12} /></button>
                  <button onClick={() => handleRemove(f.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/30 hover:text-red-400" : "hover:bg-gray-100 text-gray-300 hover:text-red-500"}`}><X size={12} /></button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
