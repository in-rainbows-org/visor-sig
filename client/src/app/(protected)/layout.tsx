import React from "react";
import { LayoutScrollProvider } from "@/features/shared/presentation/context/layout-scroll-context";
import { ProtectedLayoutShell } from "@/features/shared/presentation/components/layout/protected-layout-shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutScrollProvider>
      <ProtectedLayoutShell>{children}</ProtectedLayoutShell>
    </LayoutScrollProvider>
  );
}

