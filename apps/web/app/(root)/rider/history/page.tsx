// apps/web/app/(root)/rider/history/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@shared/supabaseClient";
import { Database } from "@shared/supabase/types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from "@/context/AuthContext";
import {
  Package,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Phone,
  Loader2,
  ListOrdered,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";
import { LatLng } from "@/app/(root)/user/page"; // Re-using LatLng type

// --- Type Definitions ---

// Define the structure of the `notes` JSON for an order_item (package)
interface PackageNotes {
  pickup_address: string;
  pickup_coords: LatLng;
  dropoff_address: string;
  dropoff_coords: LatLng;
  item_description: string;
}

// Define the type for an OrderItem object after parsing its notes for history display
type HistoryOrderItem = Omit<
  Database["public"]["Tables"]["order_item"]["Row"],
  "menu_item_id" | "notes"
> & {
  package_details: PackageNotes | null; // Parsed notes for package details
};

// Define the type for an Order object from Supabase query for history
type HistoryOrder = {
  id: string;
  total_amount: number;
  status: string | null;
  created_at: string | null;
  user_id: { name: string | null; phone: string | null } | null; // Customer info
  order_item: HistoryOrderItem[] | null; // Packages
};

// --- Constants ---
const PAGE_SIZE = 10; // Number of orders to fetch per load

export default function RiderHistoryPage() {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // Current page for pagination
  const [hasMore, setHasMore] = useState(true); // Indicates if more orders are available

  // Function to fetch historical orders
  const fetchOrders = useCallback(
    async (pageNum: number) => {
      if (!user) {
        setError("User not logged in. Please log in to view your history.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      try {
        const { data, error: fetchError } = await supabase
          .from("order")
          .select(
            `
            id,
            total_amount,
            status,
            created_at,
            user_id (name, phone),
            order_item (id, quantity, price, notes)
          `
          )
          .eq("rider_id", user.id)
          .in("status", ["delivering", "delivered", "cancelled", "failed", "processing", "accepted"]) // Fetch completed or cancelled orders
          .order("created_at", { ascending: false }) // Newest first
          .range(from, to); // Apply pagination range

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Process data to parse order_item notes
        const processedData: HistoryOrder[] = data.map((order: any) => ({
          id: order.id,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at,
          user_id: Array.isArray(order.user_id)
            ? order.user_id[0] || null
            : order.user_id || null,
          order_item:
            order.order_item?.map((item: any) => {
              let package_details: PackageNotes | null = null;
              if (item.notes && typeof item.notes === "string") {
                try {
                  package_details = JSON.parse(item.notes) as PackageNotes;
                } catch (e) {
                  console.error(
                    "Failed to parse order_item notes for history:",
                    e
                  );
                }
              }
              return {
                ...item,
                package_details,
              };
            }) || null,
        }));

        setOrders((prevOrders) => [...prevOrders, ...processedData]);
        setHasMore(processedData.length === PAGE_SIZE); // If less than PAGE_SIZE, no more data
        setPage(pageNum + 1); // Increment page for next fetch
      } catch (err: any) {
        console.error("Error fetching order history:", err);
        setError(err.message || "Failed to load order history.");
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Initial fetch on component mount
  useEffect(() => {
    setOrders([]); // Clear previous orders on user change or initial load
    setPage(0); // Reset page
    setHasMore(true); // Assume there's more data initially
    fetchOrders(0);
  }, [user, fetchOrders]);

  // Handle "Load More" button click
  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchOrders(page);
    }
  };

  // --- Render ---
  if (isLoading && orders.length === 0) {
    // Show initial loader only if no data yet
    return (
      <div className="flex w-full justify-center items-center h-screen">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-gray-700">Loading order history...</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    // Show error if no data could be loaded
    return (
      <div className="text-red-600 text-center mt-8 p-4">
        <p>{error}</p>
        <p>Please try again later or ensure you are logged in.</p>
        <Link
          href="/auth/login"
          className="text-blue-600 hover:underline mt-4 block"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (orders.length === 0 && !isLoading) {
    // Show empty state if no orders found after loading
    return (
      <div className="text-gray-700 text-center flex w-full h-screen justify-center items-center p-4">
        <p className="text-2xl font-semibold">No past deliveries found.</p>
        <p className="text-md mt-2">
          Start accepting new orders to build your history!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-8 text-gray-800 overflow-y-auto glass-scrollbar">
      <ToastContainer position="top-right" autoClose={5000} />

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Delivery History
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <GlassDiv
            key={order.id}
            className="p-6 flex flex-col justify-between h-full"
          >
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <ListOrdered size={20} className="text-purple-600" />
                Order ID: #{order.id.substring(0, 8)}
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(order.created_at || "").toLocaleString()}
                </p>
                <p
                  className={`capitalize font-medium flex items-center gap-2 ${
                    order.status === "delivered"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  <span className="font-medium">Status:</span>{" "}
                  {order.status?.replace(/_/g, " ") || "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <span className="font-medium">Customer:</span>{" "}
                  {order.user_id?.name || "N/A"}
                  {order.user_id?.phone && (
                    <a
                      href={`tel:${order.user_id.phone}`}
                      className="ml-2 text-blue-500 hover:underline"
                    >
                      <Phone size={14} /> Call
                    </a>
                  )}
                </p>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="font-semibold text-base mb-2 flex items-center gap-2">
                    <Package size={16} className="text-blue-600" /> Package
                    Details:
                  </p>
                  {order.order_item && order.order_item.length > 0 ? (
                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                      {order.order_item.map((item, idx) => (
                        <li key={item.id || idx}>
                          <p className="font-medium">
                            {item.package_details?.item_description ||
                              "Generic Item"}{" "}
                            (Qty: {item.quantity})
                          </p>
                          <p className="text-xs text-gray-600">
                            From:{" "}
                            {item.package_details?.pickup_address || "N/A"}
                          </p>
                          <p className="text-xs text-gray-600">
                            To: {item.package_details?.dropoff_address || "N/A"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      No detailed package info.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-dashed border-gray-300 pt-4">
              <p className="text-xl font-bold text-orange-600 flex items-center justify-between">
                <span>Total Earned:</span>
                <span>₦{order.total_amount?.toFixed(2) || "0.00"}</span>
              </p>
            </div>
          </GlassDiv>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <GlassButton
            onClick={handleLoadMore}
            disabled={isLoading}
            className="!bg-orange-500 hover:!bg-orange-600 text-white font-semibold flex items-center justify-center gap-2 px-6 py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ArrowRight size={20} />
            )}
            {isLoading ? "Loading More..." : "Load More Deliveries"}
          </GlassButton>
        </div>
      )}

      {!hasMore && orders.length > 0 && !isLoading && (
        <p className="text-center text-gray-500 mt-8">
          You've reached the end of your delivery history.
        </p>
      )}
    </div>
  );
}
