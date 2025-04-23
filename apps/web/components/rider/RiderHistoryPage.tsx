// apps/web/components/rider/RiderHistoryPage.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { Database } from "@shared/supabase/types";
import { supabase } from "@shared/supabaseClient";

// Assuming you have GlassDiv, Section components
import GlassDiv from "@/components/ui/GlassDiv";
import Section from "@/components/reuse/Section";
import {
  Loader2,
  Package,
  Calendar,
  DollarSign,
  User,
  Store,
  MapPin,
} from "lucide-react"; // Added icons
import Link from "next/link";

// Define types for fetched history data based on your schema and select query
// This type should precisely match the structure returned by the .select() query for history
type HistoricalOrder = {
  id: string;
  total_amount: number;
  status: string | null;
  created_at: string | null;
  // Select only name for customer profile
  user_id: { name: string | null } | null;
  // Select only name for vendor profile
  vendor_id: { name: string | null } | null;
  // Select relevant address fields for summary
  delivery_address_id: {
    city: string | null;
    state: string | null;
    country: string | null;
  } | null;
};

// Define possible order statuses for completed orders that should appear in history
const COMPLETED_ORDER_STATUSES = ["delivered", "cancelled", "failed"];

export default function RiderHistoryPage() {
  const { user } = useAuthContext(); // Get the logged-in user (rider)
  // Ensure your @shared/supabaseClient exports a client instance named 'supabase'
  // const supabase = createClient(); // Removed this line

  const [historyOrders, setHistoryOrders] = useState<HistoricalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchHistoryOrders = async () => {
      if (!user) {
        setError("User not logged in.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Fetch completed orders assigned to the current rider
      const { data, error: fetchError } = await supabase
        .from("order")
        .select(
          `
          id,
          total_amount,
          status,
          created_at,
          user_id (name), // Select only customer name
          vendor_id (name), // Select only vendor name
          delivery_address_id (city, state, country) // Select relevant address parts
          `
        )
        .eq("rider_id", user.id) // Filter by the logged-in rider's ID
        .in("status", COMPLETED_ORDER_STATUSES) // Filter by completed statuses
        .order("created_at", { ascending: false }); // Order by newest first

      if (fetchError) {
        console.error("Error fetching history orders:", fetchError);
        setError("Failed to load order history.");
        setHistoryOrders([]); // Ensure historyOrders is empty on error
      } else {
        // Supabase select with relationships like user_id(name) returns an array
        // even for many-to-one relationships in some setups.
        // We need to process the data to flatten these relationships if they come as arrays.
        // Based on previous issues, let's assume relationships might return arrays.
        const processedData: HistoricalOrder[] = data
          ? data.map((order: any) => ({
              ...order,
              // Extract the first element from the arrays, or null if the array is null or empty
              user_id:
                order.user_id && order.user_id.length > 0
                  ? order.user_id[0]
                  : null,
              vendor_id:
                order.vendor_id && order.vendor_id.length > 0
                  ? order.vendor_id[0]
                  : null,
              delivery_address_id:
                order.delivery_address_id &&
                order.delivery_address_id.length > 0
                  ? order.delivery_address_id[0]
                  : null,
            }))
          : [];

        setHistoryOrders(processedData);
      }

      setIsLoading(false);
    };

    // Only fetch if user is available
    if (user) {
      fetchHistoryOrders();
    } else {
      setIsLoading(false); // Stop loading if no user
    }
  }, [user]); // Re-run effect if user changes (supabase client instance from import should be stable)

  // --- Render ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-gray-700">Loading order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center mt-8">
        <p>{error}</p>
        <p>Please try again later.</p>
      </div>
    );
  }

  if (!historyOrders || historyOrders.length === 0) {
    return (
      <div className="text-gray-700 text-center mt-8">
        <p>No order history found.</p>
      </div>
    );
  }

  // Display the order history list
  return (
    <div className="w-full h-full p-4 md:p-8 text-gray-800 overflow-y-auto glass-scrollbar">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>

      <div className="space-y-6">
        {historyOrders.map((order) => (
          <GlassDiv
            key={order.id}
            className="rounded-2xl p-6 border border-white/20 shadow-lg space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package size={18} /> Order #{order.id.substring(0, 8)}{" "}
                  {/* Truncate ID */}
                </h2>
                <p
                  className={`text-sm capitalize ${
                    order.status === "delivered"
                      ? "text-green-800"
                      : order.status === "cancelled"
                        ? "text-red-800"
                        : order.status === "failed"
                          ? "text-red-800"
                          : "text-gray-600" // Fallback
                  }`}
                >
                  Status: {order.status?.replace("_", " ") || "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-700">
                  ₦{order.total_amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar size={14} />{" "}
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <User size={16} /> Customer: {order.user_id?.name || "N/A"}
              </div>
              <div className="flex items-center gap-2">
                <Store size={16} /> Vendor: {order.vendor_id?.name || "N/A"}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} /> Delivered To:{" "}
                {order.delivery_address_id
                  ? `${order.delivery_address_id.city || ""}${order.delivery_address_id.city && order.delivery_address_id.state ? ", " : ""}${order.delivery_address_id.state || ""}${order.delivery_address_id.state && order.delivery_address_id.country ? ", " : ""}${order.delivery_address_id.country || ""}`
                      .replace(/^, /, "")
                      .replace(/, $/, "") // Construct address string, handle missing parts
                  : "N/A"}
              </div>
            </div>

            {/* Optional: Link to a detailed order view page */}
            <div className="mt-4 text-right">
              <Link
                href={`/rider/history/${order.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                View Details
              </Link>
            </div>
          </GlassDiv>
        ))}
      </div>
    </div>
  );
}
