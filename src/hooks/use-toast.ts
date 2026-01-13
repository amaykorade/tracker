"use client";

export type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

// Re-export from provider
export { useToast } from "@/components/providers/toast-provider";

