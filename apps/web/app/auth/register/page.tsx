"use client";
import React, { Suspense } from "react";
import RegisterContent from "@/components/auth/RegisterContent";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center m-auto">Loading registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
