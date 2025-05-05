// app/(root)/user/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import GlassDiv from "@/components/ui/GlassDiv";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import PaystackInline from "@paystack/inline-js";

export default function CheckoutPage() {
  const { cart, getTotal, clearCart } = useCart();
  const { user } = useAuthContext();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cart.length === 0) router.push("/user/cart");
  }, [cart, router]);

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const total = getTotal() + 500; // ₦500 delivery

  const payWithPaystack = () => {
    if (!address.trim()) {
      toast.error("Please enter delivery address");
      return;
    }
    setLoading(true);

    const paystack = new PaystackInline();

    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PK!,
      email: user.email!,
      amount: total * 100, // in kobo
      metadata: {
        custom_fields: [
          {
            display_name: "Delivery address",
            variable_name: "address",
            value: address,
          },
        ],
      },

      // success callback
      onSuccess: async (tranx) => {
        toast.success("Payment successful! Verifying…");
        try {
          const res = await fetch("/api/paystack/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: tranx.reference, cart, address }),
          });
          const json = await res.json();
          if (res.ok) {
            toast.success("Order placed!");
            clearCart();
            router.push("/user/thank-you");
          } else {
            toast.error(json.error || "Verification failed");
          }
        } catch {
          toast.error("Server error");
        } finally {
          setLoading(false);
        }
      },

      // user closed iframe
      onCancel: () => {
        toast.info("Payment window closed.");
        setLoading(false);
      },

      // error during setup
      onError: (err) => {
        toast.error("Payment setup failed: " + err.message);
        setLoading(false);
      },
    });
  };

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

      <button
        onClick={payWithPaystack}
        disabled={loading}
        className={`w-full py-3 rounded-xl text-white ${
          loading ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        {loading ? "Processing…" : "Pay with Paystack"}
      </button>
    </div>
  );
}
