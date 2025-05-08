// app/(root)/user/checkout/page.tsx
import dynamic from "next/dynamic";
import React from "react";

const CheckoutClient = dynamic(
  () => import("./CheckoutClient"),
  { ssr: false }  // ← skip SSR completely
);

export default function CheckOutPage() {
  return <CheckoutClient />;
}
