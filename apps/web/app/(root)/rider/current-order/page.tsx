// apps/web/components/rider/RiderCurrentOrderPage.tsx
"use client";

import { toast } from "react-toastify";
import { Database } from "@shared/supabase/types";
import { supabase } from "@shared/supabaseClient";
import React, { useEffect, useState } from "react";
import GlassButton from "@/components/ui/GlassButton";
import { useAuthContext } from "@/context/AuthContext";

import {
  MapPin,
  User,
  Phone,
  Package,
  Clock3,
  CheckCircle,
  XCircle,
  Loader2,
  Store,
} from "lucide-react";
import Link from "next/link";

type Order = {
  id: string;
  total_amount: number;
  status: string | null;
  special_instructions: string | null;
  created_at: string | null;


  user_id: { name: string | null; phone: string | null }[] | null;
  vendor_id:
    | {
        name: string | null;
        phone: string | null;
        address: string | null;
        logo_url: string | null;
      }[]
    | null;
  delivery_address_id:
    | Database["public"]["Tables"]["delivery_address"]["Row"][]
    | null;

  // order_item is correctly typed as an array of objects
  order_item:
    | (Database["public"]["Tables"]["order_item"]["Row"] & {
        // Nested menu_item_id is a many-to-one from order_item, select('name') returns an object with name or null.
        menu_item_id: { name: string | null } | null;
      })[]
    | null;

  // Add other columns if you select them in your query that are directly on the 'order' table
  // For example: customer_support_conversation_id: string | null;
  // payment_method: string;
  // payment_status: string | null;
  // rider_id: string | null; // rider_id is used in the filter, but not selected in the result object itself
  // updated_at: string | null;
};

// Define a helper type for the shape of the data *after* extracting from arrays
type ProcessedOrder = Omit<
  Order,
  "user_id" | "vendor_id" | "delivery_address_id"
> & {
  user_id: { name: string | null; phone: string | null } | null;
  vendor_id: {
    name: string | null;
    phone: string | null;
    address: string | null;
    logo_url: string | null;
  } | null;
  delivery_address_id:
    | Database["public"]["Tables"]["delivery_address"]["Row"]
    | null;
};

// Define possible order statuses for a rider's active order
const ACTIVE_RIDER_STATUSES = ["assigned", "picked_up", "delivering"];
const FINAL_RIDER_STATUS = "delivered"; // Status after rider completes delivery

export default function RiderCurrentOrderPage() {
  const { user } = useAuthContext();

  // Use the ProcessedOrder type for the state
  const [currentOrder, setCurrentOrder] = useState<ProcessedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchCurrentOrder = async () => {
      if (!user) {
        setError("User not logged in.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Fetch the order assigned to the current rider with an active status
      // Using .select with relationships to fetch relevant nested data
      const { data, error: fetchError } = await supabase
        .from("order")
        .select(
          `
          id,
          total_amount,
          status,
          special_instructions,
          created_at,
          user_id (name, phone),
          vendor_id (name, phone, address, logo_url),
          delivery_address_id (*),
          order_item (id, quantity, price, notes, menu_item_id (name))
          `
        )
        .eq("rider_id", user.id) // Filter by the logged-in rider's ID
        .in("status", ACTIVE_RIDER_STATUSES) // Filter by active rider statuses
        .single(); // Expecting at most one current order

      if (fetchError) {
        console.error("Error fetching current order:", fetchError);
        // The error PGRST116 for 0 rows is expected if no order is assigned.
        // Only set a general error message if it's not the "0 rows" error.
        if (
          fetchError.code !== "PGRST116" ||
          fetchError.message !==
            "JSON object requested, multiple (or no) rows returned"
        ) {
          setError("Failed to load current order.");
        } else {
          // If 0 rows, it's expected, just set currentOrder to null
          setError(null); // Clear error if it was a 0-row error
        }
        setCurrentOrder(null); // Ensure currentOrder is null on any fetch error
      } else {
        // If data is null, it means no current order was found (handled by .single() returning null on 0 rows)
        // If data is not null, it's the fetched order.
        // We need to process the data to extract the single related object from the arrays
        // returned by Supabase for user_id, vendor_id, and delivery_address_id.
        const processedData: ProcessedOrder = {
          ...data,
          // Extract the first element from the arrays, or null if the array is null or empty
          user_id:
            data.user_id && data.user_id.length > 0 ? data.user_id[0] : null,
          vendor_id:
            data.vendor_id && data.vendor_id.length > 0
              ? data.vendor_id[0]
              : null,
          delivery_address_id:
            data.delivery_address_id && data.delivery_address_id.length > 0
              ? data.delivery_address_id[0]
              : null,
          order_item: data.order_item.map((item) => ({
            ...item,
            order_id: data.id, // add the order_id property
            menu_item_id:
              item.menu_item_id && item.menu_item_id.length > 0
                ? item.menu_item_id[0].name
                : null, // change menu_item_id to a single object
          })),
        };
        setCurrentOrder(processedData);
      }

      setIsLoading(false);
    };

    // Only fetch if user is available
    if (user) {
      fetchCurrentOrder();
    } else {
      setIsLoading(false); // Stop loading if no user
    }

    // Optional: Set up real-time subscription for the rider's order
    // This would allow the page to update automatically if the order status changes
    // (e.g., if the vendor marks it as picked up, or the user cancels)
    // This requires more advanced Supabase Realtime setup and is omitted for brevity.
    // See previous response for example structure.
  }, [user]); // Re-run effect if user changes (supabase client instance from import should be stable)

  // --- Status Update Logic ---
  const handleStatusUpdate = async (newStatus: string) => {
    if (!currentOrder) return;

    setIsUpdatingStatus(true);
    setError(null); // Clear previous errors

    // Call an API route to update the order status securely on the server
    // This is recommended to enforce business logic and RLS
    // You MUST implement the /api/rider/update-order-status route
    try {
      const response = await fetch("/api/rider/update-order-status", {
        method: "POST", // Or PATCH depending on your API design
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: currentOrder.id,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          result.message || `Order status updated to ${newStatus}.`
        );
        // Update the local state with the new status
        setCurrentOrder((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );

        // If the order is delivered, clear the current order state
        if (newStatus === FINAL_RIDER_STATUS) {
          setCurrentOrder(null);
          toast.info("Order completed!");
        }
      } else {
        console.error("Failed to update order status:", result.error);
        setError(result.error || "Failed to update order status.");
        toast.error(result.error || "Failed to update order status.");
      }
    } catch (err) {
      console.error("Error calling status update API:", err);
      setError("An unexpected error occurred while updating status.");
      toast.error("An unexpected error occurred while updating status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Construct the full delivery address string
  const fullAddress = currentOrder?.delivery_address_id
    ? `${currentOrder.delivery_address_id.street}, ${currentOrder.delivery_address_id.city}, ${currentOrder.delivery_address_id.state}, ${currentOrder.delivery_address_id.country}`
    : "N/A";

  // Construct the map query using lat/lng if available, fallback to address string
  const mapQuery =
    currentOrder?.delivery_address_id?.lat &&
    currentOrder?.delivery_address_id?.lng
      ? `${currentOrder.delivery_address_id.lat},${currentOrder.delivery_address_id.lng}`
      : encodeURIComponent(fullAddress); // Encode address string for URL

  // Base URL for Google Maps embed
  // Note: The URL format https://maps.google.com/maps?q=$... might be specific or incorrect.
  // A more standard embed format is https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=... or using lat/lng.
  // For a simple link to open in Google Maps app/website, use https://www.google.com/maps/search/?api=1&query=...
  // Let's use a standard search link for simplicity, as embed requires an API key and specific URL structure.
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  // --- Render ---
  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center h-full">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-gray-700">Loading current order...</p>
      </div>
    );
  }

  // Only show the general error message if it's not the expected "0 rows" error
  if (
    error &&
    (error !== "Failed to load current order." || currentOrder === null)
  ) {
    return (
      <div className="text-red-600 text-center mt-8">
        <p>{error}</p>
        <p>Please try again later.</p>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="text-gray-700 text-center w-full mt-8">
        <p>You do not have a current order assigned.</p>
        {/* Optional: Link to available orders page if applicable */}
        {/* <Link href="/rider/available-orders">View available orders</Link> */}
      </div>
    );
  }

  // Display the current order details using the demo design structure
  return (
    <div className="w-full h-full p-4 md:p-8 text-gray-800 overflow-y-auto glass-scrollbar">
      {" "}
      {/* Added overflow and scrollbar */}
      <h1 className="text-2xl font-bold mb-6">Current Order</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Order Details */}
        <div className="flex-1 backdrop-blur bg-white/30 rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <Package size={18} /> Order ID: #{currentOrder.id.substring(0, 8)}{" "}
              {/* Display truncated ID */}
            </h2>
            <p
              className={`text-sm capitalize ${
                currentOrder.status === "assigned"
                  ? "text-blue-800"
                  : currentOrder.status === "picked_up"
                    ? "text-yellow-800"
                    : currentOrder.status === "delivering"
                      ? "text-green-800"
                      : "text-gray-600" // Fallback
              }`}
            >
              Status: {currentOrder.status?.replace("_", " ") || "N/A"}{" "}
              {/* Handle null status */}
            </p>
          </div>

          <div className="space-y-4 text-sm">
            {/* Customer Info */}
            <div className="flex items-center gap-3">
              <User size={18} />
              <span>{currentOrder.user_id?.name || "N/A"}</span>
              {/* Optional: Call Customer Button */}
              {currentOrder.user_id?.phone && (
                <a
                  href={`tel:${currentOrder.user_id.phone}`}
                  className="ml-auto"
                >
                  {" "}
                  {/* ml-auto pushes button to the right */}
                  <GlassButton className="!text-blue-500 hover:!bg-blue-100/60 hover:border-blue-500 cursor-pointer rounded-md p-1">
                    <Phone size={16} />
                  </GlassButton>
                </a>
              )}
            </div>

            {/* Vendor Info */}
            <div className="flex items-center gap-3">
              <Store size={18} />
              <span>{currentOrder.vendor_id?.name || "N/A"}</span>
              {/* Optional: Call Vendor Button */}
              {currentOrder.vendor_id?.phone && (
                <a
                  href={`tel:${currentOrder.vendor_id.phone}`}
                  className="ml-auto"
                >
                  {" "}
                  {/* ml-auto pushes button to the right */}
                  <GlassButton className="!text-blue-500 hover:!bg-blue-100/60 hover:border-blue-500 cursor-pointer rounded-md p-1">
                    <Phone size={16} />
                  </GlassButton>
                </a>
              )}
            </div>

            {/* Delivery Address */}
            <div className="flex items-start gap-3">
              <MapPin size={18} />
              <span>{fullAddress}</span>
              {/* Optional: View on Map Button */}
              {/* Changed to a standard Google Maps search link */}
              {fullAddress !== "N/A" && ( // Only show button if address is available
                <a
                  href={mapSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto" // ml-auto pushes button to the right
                >
                  <GlassButton className="!text-green-500 hover:!bg-green-100/60 hover:border-green-500 cursor-pointer rounded-md p-1">
                    <MapPin size={16} />
                  </GlassButton>
                </a>
              )}
            </div>

            {/* Package Details (List of Items) */}
            <div className="flex items-start gap-3">
              <Package size={18} />
              <div className="flex flex-col">
                <span className="font-semibold">Items:</span>
                {currentOrder.order_item &&
                currentOrder.order_item.length > 0 ? (
                  <ul className="list-disc pl-5 text-gray-700">
                    {currentOrder.order_item.map((item) => (
                      <li key={item.id}>
                        <span className="font-semibold">{item.quantity}x</span>{" "}
                        {item.menu_item_id?.name || "Unknown Item"} - $
                        {item.price.toFixed(2)} each
                        {item.notes && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({item.notes})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600">No items listed.</span>
                )}
              </div>
            </div>

            {/* Estimated Time - NOTE: This is not in your DB schema, hardcoded in demo */}
            {/* You would need to calculate or fetch this from a logistics service */}
            <div className="flex items-center gap-3">
              <Clock3 size={18} />
              <span>
                WAT: {currentOrder.status === "assigned" ? "30 minutes" : "N/A"}
              </span>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-3">
              <span className="font-semibold">Amount:</span>
              <span className="text-green-700 font-bold text-lg">
                ₦{currentOrder.total_amount.toFixed(2)} {/* Format amount */}
              </span>
            </div>

            {/* Special Instructions */}
            {currentOrder.special_instructions && (
              <div className="flex items-start gap-3">
                <span className="font-semibold">Instructions:</span>
                <span className="text-gray-600 italic">
                  {currentOrder.special_instructions}
                </span>
              </div>
            )}
          </div>

          {/* Rider Actions (Status Update Buttons) */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            {/* Buttons are conditionally rendered based on current status */}
            {currentOrder.status === "assigned" && (
              <GlassButton
                onClick={() => handleStatusUpdate("picked_up")}
                disabled={isUpdatingStatus}
                className="flex-1 !bg-yellow-500 hover:!bg-yellow-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isUpdatingStatus ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Package size={18} />
                )}
                Mark as Picked Up
              </GlassButton>
            )}

            {currentOrder.status === "picked_up" && (
              <GlassButton
                onClick={() => handleStatusUpdate("delivering")}
                disabled={isUpdatingStatus}
                className="flex-1 !bg-blue-500 hover:!bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isUpdatingStatus ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MapPin size={18} />
                )}
                Mark as Delivering
              </GlassButton>
            )}

            {currentOrder.status === "delivering" && (
              <GlassButton
                onClick={() => handleStatusUpdate("delivered")}
                disabled={isUpdatingStatus}
                className="flex-1 !bg-green-500 hover:!bg-green-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isUpdatingStatus ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Mark as Delivered
              </GlassButton>
            )}

            {/* Note: "Cancel Order" button from demo is not included here
                 as cancellation is typically not a rider action in this workflow.
                 Consider adding a "Report Issue" button if needed.
            */}
            {/* Example Report Issue Button (requires backend implementation) */}
            <GlassButton
              onClick={() => alert("Implement Report Issue")}
              disabled={isUpdatingStatus}
              className="flex-1 !bg-red-500 hover:!bg-red-600 text-white font-semibold flex items-center justify-center gap-2"
            >
              <XCircle size={18} /> Report Issue
            </GlassButton>
          </div>
        </div>

        {/* Map Section */}
        {/* Only render map if delivery address has lat/lng */}
        {/* Changed to use a standard Google Maps search link instead of embed iframe */}
        {fullAddress !== "N/A" && (
          <div className="flex-1 h-[400px] lg:h-auto rounded-2xl overflow-hidden border border-white/20 shadow-lg backdrop-blur bg-white/30">
            {/* You could embed a map here if you have an API key and prefer that */}
            {/* For a simple link to open in a new tab: */}
            <a
              href={mapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-full flex items-center justify-center text-blue-600 hover:underline"
            >
              View Delivery Location on Map
            </a>
          </div>
        )}
        {/* Show message if no location data for map */}
        {fullAddress === "N/A" && (
          <div className="flex-1 h-[400px] lg:h-auto rounded-2xl flex items-center justify-center border border-white/20 shadow-lg backdrop-blur bg-white/30 text-gray-600">
            No delivery address available.
          </div>
        )}
      </div>
    </div>
  );
}
