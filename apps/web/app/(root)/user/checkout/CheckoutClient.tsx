// app/(root)/user/checkout/CheckoutClient.tsx
"use client";

import { useState, useEffect } from "react";
import GlassDiv from "@/components/ui/GlassDiv";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { supabase } from "@shared/supabaseClient";
import { type Database } from "@shared/supabase/types";
type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

// Import types for the pending order from the main user page
import { AddressDetail } from "@/app/(root)/user/page";

// Define a type for the pending order details
interface PendingOrderDetails {
  userId: string;
  riderId: string | null;
  totalAmount: number;
  distanceKm: number | null;
  packages: Array<{
    pickup: AddressDetail;
    dropoff: AddressDetail;
    quantity: number;
    description: string;
  }>;
  timestamp: number; // For basic validation
}

export default function CheckoutClient() {
  const { user } = useAuthContext();
  const router = useRouter();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [Paystack, setPaystack] = useState<any>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrderDetails | null>(
    null
  );

  // Lazy-load PaystackInline on the client
  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        const mod = await import("@paystack/inline-js");
        setPaystack(() => mod.default);
      }
    })();
  }, []);

  // Fetch pending order details from localStorage and set address
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const storedOrder = localStorage.getItem("pendingOrderDetails");
    if (storedOrder) {
      try {
        const parsedOrder: PendingOrderDetails = JSON.parse(storedOrder);
        // Basic validation (e.g., check timestamp, ensure user matches)
        if (
          parsedOrder.userId !== user.id ||
          Date.now() - parsedOrder.timestamp > 10 * 60 * 1000 // 10 minutes expiry
        ) {
          toast.error("Invalid or expired order details. Please try again.");
          localStorage.removeItem("pendingOrderDetails");
          router.push("/user"); // Redirect back to delivery page
          return;
        }
        setPendingOrder(parsedOrder);
        // Set the delivery address from the first package's dropoff
        if (parsedOrder.packages[0]?.dropoff?.text) {
          setDeliveryAddress(parsedOrder.packages[0].dropoff.text);
        } else {
          toast.warn("Dropoff address not found in order details.");
        }
      } catch (e) {
        console.error("Failed to parse pending order:", e);
        toast.error("Error loading order details. Please try again.");
        localStorage.removeItem("pendingOrderDetails");
        router.push("/user");
      }
    } else {
      toast.error("No pending order found. Please initiate a new delivery.");
      router.push("/user"); // Redirect back if no pending order
    }
  }, [user, router]);

  const totalAmount = pendingOrder?.totalAmount || 0; // Use totalAmount from pending order

  const payWithPaystack = () => {
    if (!deliveryAddress.trim()) {
      toast.error("Please enter delivery address");
      return;
    }
    if (!user?.email) {
      toast.error("User email not found. Please log in again.");
      return;
    }
    if (!pendingOrder || totalAmount <= 0) {
      toast.error("No valid order to process.");
      return;
    }

    if (!Paystack) {
      toast.error("Payment SDK not loaded yet");
      return;
    }

    setLoading(true);

    const paystack = new Paystack();

    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PK!,
      email: user.email,
      amount: totalAmount * 100, // Paystack amount is in kobo
      metadata: {
        custom_fields: [
          {
            display_name: "Delivery address",
            variable_name: "address",
            value: deliveryAddress,
          },
        ],
        order_details: JSON.stringify(pendingOrder), // Store full order details in metadata
      },

      onSuccess: async (tranx: any) => {
        toast.success("Payment successful! Finalizing order…");
        try {
          // --- BEGIN: Add order to Supabase DB ---
          // This logic was previously in user/page.tsx
          let primaryDropoffAddressId: string | undefined = undefined;
          const firstPackageDropoff = pendingOrder.packages[0]?.dropoff;
          if (firstPackageDropoff) {
            const deliveryAddressPayload: TablesInsert<"delivery_address"> = {
              street:
                `${firstPackageDropoff.street_number || ""} ${firstPackageDropoff.route || ""}`.trim() ||
                firstPackageDropoff.text ||
                "N/A",
              city: firstPackageDropoff.locality || "N/A",
              state: firstPackageDropoff.administrative_area_level_1 || "N/A",
              country: firstPackageDropoff.country || "N/A", // Corrected this line
              postal_code: firstPackageDropoff.postal_code || null, // null instead of "N/A" for postal_code
              lat: firstPackageDropoff.coords.lat,
              lng: firstPackageDropoff.coords.lng,
              user_id: pendingOrder.userId,
            };
            const { data, error } = await supabase
              .from("delivery_address")
              .insert(deliveryAddressPayload)
              .select("id")
              .single();
            if (error)
              throw new Error(`Dropoff address save failed: ${error.message}`);
            primaryDropoffAddressId = data.id;
          }

          const orderPayload: TablesInsert<"order"> = {
            user_id: pendingOrder.userId,
            rider_id: pendingOrder.riderId,
            status: "pending_confirmation", // Initial status after payment
            total_amount: pendingOrder.totalAmount,
            payment_method: "Paystack", // Indicate payment method
            special_instructions: `Order for ${pendingOrder.packages.length} package(s). Distance: ${pendingOrder.distanceKm || "N/A"}km. Paystack Ref: ${tranx.reference}`,
            delivery_address_id: primaryDropoffAddressId || null,
          };
          const { data: orderData, error: orderError } = await supabase
            .from("order")
            .insert(orderPayload)
            .select("id")
            .single();
          if (orderError)
            throw new Error(`Order creation failed: ${orderError.message}`);
          const orderId = orderData.id;

          const orderItemsPayload: TablesInsert<"order_item">[] =
            pendingOrder.packages.map((pkg) => {
              // Ensure pickup/dropoff are not null, though PendingOrderDetails type guarantees it
              if (!pkg.pickup || !pkg.dropoff)
                throw new Error(
                  "Package details missing during order creation."
                );
              return {
                order_id: orderId,
                quantity: pkg.quantity,
                notes: JSON.stringify({
                  pickup_address: pkg.pickup.text,
                  pickup_coords: pkg.pickup.coords,
                  dropoff_address: pkg.dropoff.text,
                  dropoff_coords: pkg.dropoff.coords,
                  item_description: pkg.description,
                }),
                price: 0, // Delivery items typically have price 0 here, total is on the order
                menu_item_id: null, // Not a menu item
              };
            });
          const { error: orderItemsError } = await supabase
            .from("order_item")
            .insert(orderItemsPayload);
          if (orderItemsError) {
            // Rollback the created order and address if order items fail
            await supabase.from("order").delete().eq("id", orderId);
            if (primaryDropoffAddressId)
              await supabase
                .from("delivery_address")
                .delete()
                .eq("id", primaryDropoffAddressId);
            throw new Error(
              `Package save failed: ${orderItemsError.message}. Booking cancelled.`
            );
          }
          // --- END: Add order to Supabase DB ---

          toast.success("Order placed successfully!");
          localStorage.removeItem("pendingOrderDetails"); // Clear pending order after success
          router.push(`/user/orders/${orderId}`); // Redirect to new order's detail page
        } catch (error: any) {
          console.error("Order finalization failed:", error);
          toast.error(error.message || "Order creation failed after payment.");
          // You might want to log this error and potentially offer a refund or manual review
        } finally {
          setLoading(false);
        }
      },

      onCancel: () => {
        toast.info("Payment window closed.");
        setLoading(false);
      },

      onError: (err: any) => {
        toast.error("Payment setup failed: " + err.message);
        setLoading(false);
      },
    });
  };

  if (!pendingOrder) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl animate-pulse">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="p-4 w-full max-w-2xl mx-auto space-y-6">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-center text-gray-800">Checkout</h1>
      <div className="flex flex-col md:flex-row items-center justify-center w-full gap-4 flex-wrap">
        <GlassDiv className="flex-1 min-w-[280px]">
          <h2 className="font-semibold text-xl mb-3 text-gray-700">
            Order Summary
          </h2>
          <ul className="space-y-2 text-gray-600">
            {pendingOrder.packages.map((pkg, index) => (
              <li key={index} className="border-b border-gray-100 pb-2">
                <p className="font-medium">Package #{index + 1}</p>
                <p className="text-sm pl-2">
                  <span className="font-semibold">Pickup:</span>{" "}
                  {pkg.pickup.text}
                </p>
                <p className="text-sm pl-2">
                  <span className="font-semibold">Drop-off:</span>{" "}
                  {pkg.dropoff.text}
                </p>
                <p className="text-sm pl-2">
                  <span className="font-semibold">Qty:</span> {pkg.quantity}
                  {pkg.description && ` (${pkg.description})`}
                </p>
              </li>
            ))}
            <li className="flex justify-between pt-3 text-base">
              <span className="font-semibold">Distance:</span>
              <span>{pendingOrder.distanceKm?.toFixed(2)} km</span>
            </li>
            <li className="flex justify-between pt-2 border-t border-dashed border-gray-300">
              <span className="font-semibold text-lg">Total Amount</span>
              <span className="font-bold text-lg text-orange-600">
                ₦{totalAmount.toFixed(2)}
              </span>
            </li>
          </ul>
        </GlassDiv>

        <GlassDiv className="w-full md:w-1/2 flex-1 min-w-[280px]">
          <h2 className="font-semibold text-xl mb-3 text-gray-700">
            Delivery Address
          </h2>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            rows={4}
            placeholder="Enter your delivery address"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be the primary drop-off address for your order.
          </p>
        </GlassDiv>
      </div>

      <button
        onClick={payWithPaystack}
        disabled={loading || !pendingOrder || totalAmount <= 0}
        className={`w-full py-4 rounded-xl text-lg font-semibold transition-all shadow-md hover:shadow-lg
          ${
            loading
              ? "bg-gray-400 text-gray-100 cursor-not-allowed"
              : "bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
          }`}
      >
        {loading
          ? "Processing Payment…"
          : `Pay ₦${totalAmount.toFixed(2)} with Paystack`}
      </button>
    </div>
  );
}
