// apps/web/app/(root)/user/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import GlassDiv from "@/components/ui/GlassDiv";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function CheckoutPage() {
  const { cart, getTotal, clearCart } = useCart();
  const { user } = useAuthContext();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  // redirect if no items
  useEffect(() => {
    if (cart.length === 0) router.push("/user/cart");
  }, [cart]);

  const total = getTotal() + 500; // ₦500 delivery
  const payWithPaystack = () => {
    if (!address.trim()) {
      toast.error("Please enter delivery address");
      return;
    }
    const handler = (window as any).PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PK,
      email: user?.email,
      amount: total * 100, // in kobo
      metadata: {
        custom_fields: [{ display_name: "Address", value: address }],
      },
      callback: function (response: any) {
        toast.success("Payment successful!");
        clearCart();
        router.push("/user/thank-you");
      },
      onClose: function () {
        toast.info("Payment window closed.");
      },
    });
    handler.openIframe();
  };
  const handleSuccess = (ref: any) => {
    // e.g. call your API to record payment, then:
    clearCart();
    router.push("/user/thank-you");
  };

  const handleClose = () => {
    // closed without payment
    setError("Payment not completed. Please try again.");
  };

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Checkout</h1>

      <GlassDiv>
        <h2 className="font-semibold mb-2">Delivery Address</h2>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          placeholder="Enter your delivery address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </GlassDiv>

      <GlassDiv>
        <h2 className="font-semibold mb-2">Order Summary</h2>
        <ul className="space-y-1">
          {cart.map((it) => (
            <li key={it.id} className="flex justify-between">
              <span>
                {it.name} × {it.quantity}
              </span>
              <span>₦{it.price * it.quantity}</span>
            </li>
          ))}
          <li className="flex justify-between pt-2 border-t">
            <span>Delivery fee</span>
            <span>₦500</span>
          </li>
          <li className="flex justify-between font-bold pt-2">
            <span>Total</span>
            <span>₦{total}</span>
          </li>
        </ul>
      </GlassDiv>

      {error && <p className="text-red-500 text-center">{error}</p>}

      <button
        onClick={payWithPaystack}
        className="w-full bg-orange-500 text-white py-3 rounded-xl"
      >
        Pay with Paystack
      </button>

      {!address.trim() && (
        <p className="text-red-500 text-center">
          Please enter a delivery address to proceed.
        </p>
      )}
    </div>
  );
}
