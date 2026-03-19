"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertTriangle, CheckCircle, Info, XCircle, Loader2 } from "lucide-react";

// ─── Types ───
type ModalType = "confirm" | "success" | "error" | "info";

interface ModalState {
  open: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ModalContextValue {
  confirm: (opts: { title: string; message: string; confirmLabel?: string; cancelLabel?: string }) => Promise<boolean>;
  alert: (opts: { title: string; message: string; type?: ModalType }) => Promise<void>;
}

const ModalContext = createContext<ModalContextValue>({
  confirm: async () => false,
  alert: async () => {},
});

// ─── Icons by type ───
const icons: Record<ModalType, { icon: typeof AlertTriangle; bg: string; color: string }> = {
  confirm: { icon: AlertTriangle, bg: "bg-yellow-500/10", color: "text-yellow-400" },
  success: { icon: CheckCircle, bg: "bg-green-500/10", color: "text-green-400" },
  error: { icon: XCircle, bg: "bg-red-500/10", color: "text-red-400" },
  info: { icon: Info, bg: "bg-blue-500/10", color: "text-blue-400" },
};

const confirmBtnColor: Record<ModalType, string> = {
  confirm: "bg-[#FA3633] hover:bg-[#e0302d]",
  success: "bg-green-500 hover:bg-green-600",
  error: "bg-red-500 hover:bg-red-600",
  info: "bg-blue-500 hover:bg-blue-600",
};

// ─── Provider ───
export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>({ open: false, type: "confirm", title: "", message: "" });
  const [loading, setLoading] = useState(false);
  const resolveRef = { current: null as ((v: boolean) => void) | null };

  const confirm = useCallback((opts: { title: string; message: string; confirmLabel?: string; cancelLabel?: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        open: true, type: "confirm",
        title: opts.title, message: opts.message,
        confirmLabel: opts.confirmLabel || "ยืนยัน",
        cancelLabel: opts.cancelLabel || "ยกเลิก",
        onConfirm: () => { resolve(true); setState((s) => ({ ...s, open: false })); },
        onCancel: () => { resolve(false); setState((s) => ({ ...s, open: false })); },
      });
    });
  }, []);

  const alert = useCallback((opts: { title: string; message: string; type?: ModalType }): Promise<void> => {
    return new Promise((resolve) => {
      setState({
        open: true, type: opts.type || "info",
        title: opts.title, message: opts.message,
        confirmLabel: "ตกลง",
        onConfirm: () => { resolve(); setState((s) => ({ ...s, open: false })); },
      });
    });
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}
      {state.open && <ModalUI state={state} loading={loading} setLoading={setLoading} />}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}

// ─── Modal UI ───
function ModalUI({ state, loading, setLoading }: { state: ModalState; loading: boolean; setLoading: (v: boolean) => void }) {
  const { isDark } = useTheme();
  const c = (d: string, l: string) => (isDark ? d : l);
  const iconInfo = icons[state.type];
  const Icon = iconInfo.icon;

  const handleConfirm = async () => {
    if (state.onConfirm) {
      setLoading(true);
      try { await state.onConfirm(); } finally { setLoading(false); }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/60" onClick={state.type !== "confirm" ? handleConfirm : state.onCancel} />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[400px] max-w-[90vw] ${c("bg-[#0a0a0a] border-white/10", "bg-white border-gray-200")} border rounded-2xl shadow-2xl`}>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${iconInfo.bg} flex items-center justify-center`}>
              <Icon size={20} className={iconInfo.color} />
            </div>
            <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>{state.title}</h2>
          </div>

          {/* Message */}
          <p className={`text-sm ${c("text-white/60", "text-gray-600")} whitespace-pre-line`}>{state.message}</p>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-2 ${confirmBtnColor[state.type]}`}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {state.confirmLabel || "ตกลง"}
            </button>
            {state.type === "confirm" && state.onCancel && (
              <button
                onClick={state.onCancel}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${c("bg-white/5 text-white/60 hover:bg-white/10", "bg-gray-100 text-gray-600 hover:bg-gray-200")}`}
              >
                {state.cancelLabel || "ยกเลิก"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
