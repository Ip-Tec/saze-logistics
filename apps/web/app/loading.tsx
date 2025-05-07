// app/loading.tsx
"use client";

import { Spinner } from "@/components/ui/Spinner"; // your spinner component

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/50 z-50">
      {/* semi‑opaque backdrop */}
      <Spinner size="lg" />
    </div>
  );
}
