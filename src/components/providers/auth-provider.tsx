"use client";

import { AuthProvider } from "@/hooks/use-auth";

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

