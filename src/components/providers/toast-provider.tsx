"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Toast, ToastVariant } from "@/hooks/use-toast";

interface ToastContextType {
  toast: (props: Omit<Toast, "id">) => { id: string; dismiss: () => void };
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ ...props }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        ...props,
        id,
        onDismiss: () => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        },
      };

      setToasts((prev) => {
        const newToasts = [newToast, ...prev].slice(0, TOAST_LIMIT);
        return newToasts;
      });

      // Auto dismiss after delay
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_REMOVE_DELAY);

      return {
        id,
        dismiss: () => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        },
      };
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

