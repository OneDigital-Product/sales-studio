"use client";

import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />,
  error: <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />,
  warning: <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />,
  info: <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />,
};

const toastStyles: Record<ToastType, string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const contextValue: ToastContextType = {
    showToast,
    success: (message, duration) => showToast("success", message, duration),
    error: (message, duration) => showToast("error", message, duration),
    warning: (message, duration) => showToast("warning", message, duration),
    info: (message, duration) => showToast("info", message, duration),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex max-w-md flex-col gap-2">
        {toasts.map((toast) => (
          <div
            className={cn(
              "slide-in-from-top-5 fade-in flex animate-in items-start gap-3 rounded-md border p-4 shadow-lg",
              toastStyles[toast.type]
            )}
            key={toast.id}
          >
            {toastIcons[toast.type]}
            <div className="flex-1 font-medium text-sm">{toast.message}</div>
            <button
              aria-label="Dismiss"
              className="flex-shrink-0 opacity-70 transition-opacity hover:opacity-100"
              onClick={() => removeToast(toast.id)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
