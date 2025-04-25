// components/vendor/OredrList.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import GlassDiv from "../ui/GlassDiv";
import { supabase } from "@shared/supabaseClient";
import { useAuthContext } from "@/context/AuthContext"; 
import { Loader2 } from "lucide-react"; 
import { toast } from "react-toastify";

// --- Type Definitions ---

// Type for the raw data fetched for the recent orders list
// Matches the selected fields and relationship structure
type RecentOrderQueryResult = {
  id: string;
  total_amount: number | null;
  status: string | null;
  created_at: string | null;
  // Relationship to fetch customer name - returns an array
  user_id: { name: string | null }[] | null;
};

// Type for the processed data used in the component's state
// Flattened structure for easier rendering
type ProcessedRecentOrder = {
  id: string;
  customerName: string; // Extracted customer name
  amount: number | null; // Order total amount
  status: string | null; // Order status
  // Add other display fields if needed, e.g., time
  // displayTime: string;
};

// --- Component ---

export default function OredrList() {
  const { user } = useAuthContext(); // Get the logged-in user (vendor)

  const [recentOrders, setRecentOrders] = useState<ProcessedRecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---

  const fetchRecentOrders = useCallback(async () => {
    if (!user?.id) {
      // Ensure user is logged in
      setError("Vendor not logged in.");
      setIsLoading(false);
      setRecentOrders([]); // Clear data if not logged in
      return;
    }

    setIsLoading(true);
    setError(null);

    const vendorId = user.id;
    const limit = 10; // Limit to the last 10 orders

    try {
      // Fetch recent orders for this vendor
      const { data, error: fetchError } = await supabase
        .from("order")
        .select(
          `
                    id,
                    total_amount,
                    status,
                    created_at,
                    user_id (name)
                `
        )
        .eq("vendor_id", vendorId) // Filter by vendor ID
        // Filter by status if you only want certain statuses, e.g.:
        // .in('status', ['delivered', 'cancelled', 'processing'])
        .order("created_at", { ascending: false }) // Get newest first
        .limit(limit); // Limit the number of results

      if (fetchError) {
        console.error("Error fetching recent orders:", fetchError);
        setError("Failed to load recent orders.");
        setRecentOrders([]); // Clear data on error
        toast.error("Failed to load recent orders."); // Show toast
      } else {
        // Process the fetched data into the desired display format
        const processedOrders: ProcessedRecentOrder[] =
          data?.map((order: RecentOrderQueryResult) => {
            // Extract customer name from the user_id relationship array
            const customerName =
              order.user_id && order.user_id.length > 0
                ? order.user_id[0].name || "N/A"
                : "N/A";

            return {
              id: order.id,
              customerName: customerName,
              amount: order.total_amount,
              status: order.status,
              // Add other fields if needed, e.g., display time
              displayTime: order.created_at ? new Date(order.created_at).toLocaleTimeString() : 'N/A',
            };
          }) || []; // Ensure processedOrders is an array even if data is null

        setRecentOrders(processedOrders);
        setError(null); // Clear error on successful fetch (even if no data)
      }
    } catch (err: any) {
      console.error(
        "An unexpected error occurred during recent orders fetch:",
        err
      );
      setError("An unexpected error occurred.");
      setRecentOrders([]);
      toast.error("An unexpected error occurred."); // Show toast
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); // Dependency on user ID

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]); // Effect depends on the fetchRecentOrders callback

  // Optional: Add Realtime subscription for new orders for this vendor
  // This would allow the list to update automatically when a new order is placed.
  // Similar to the Dashboard/Rider page examples, subscribe to 'INSERT' events
  // on the 'order' table filtered by vendor_id. You would then refetch or
  // update the state directly based on the payload.

  // --- Render ---

  return (
    // Consider making the width responsive, e.g., w-full md:w-[400px]
    <div className="w-[400px] h-full overflow-y-auto rounded-2xl bg-white/10 p-6 backdrop-blur border border-white/20 shadow-md flex flex-col gap-4 glass-scrollbar">
      <h2 className="text-white font-semibold text-lg mb-2 p-3">
        Recent Orders
      </h2>

      {/* Conditional rendering based on loading, error, and data */}
      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <Loader2 size={24} className="animate-spin text-orange-500" />
          <p className="ml-2 text-gray-700">Loading recent orders...</p>
        </div>
      )}

      {error &&
        !isLoading && ( // Show error only if not loading
          <div className="text-orange-500 text-center p-4">
            <p>{error}</p>
          </div>
        )}

      {!isLoading &&
        !error &&
        recentOrders.length === 0 && ( // Show message if no orders
          <div className="text-gray-700 text-center p-4">
            No recent orders found.
          </div>
        )}

      {/* Render list if data is available */}
      {!isLoading && !error && recentOrders.length > 0 && (
        <div className="flex flex-col gap-4">
          {" "}
          {/* Container for the list items */}
          {recentOrders.map((order) => (
            <GlassDiv
              key={order.id} // Use order ID as key - crucial for lists
              className="flex items-center justify-between p-4 rounded-xl !bg-white/70 !text-black border border-white/10"
            >
              <div>
                {/* Use customerName from processed data */}
                <p className="text-black text-sm font-medium">
                  {order.customerName}
                </p>
                {/* Display truncated order ID */}
                <p className="text-gray-900 text-xs">
                  #{order.id.substring(0, 8)}
                </p>
              </div>
              <div className="text-right">
                {/* Use amount from processed data, handle null, format */}
                <p className="text-green-700 font-semibold text-sm">
                  {" "}
                  {/* Changed color to green-700 for better visibility on light background */}
                  ₦
                  {order.amount !== null
                    ? order.amount.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "N/A"}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    // Added capitalize
                    order.status === "delivered"
                      ? "bg-green-600 text-green-100" // Adjusted text color
                      : order.status === "pending"
                        ? "bg-yellow-600 text-yellow-100" // Adjusted text color
                        : order.status === "cancelled" ||
                            order.status === "rejected" // Added rejected
                          ? "bg-red-600 text-red-100" // Adjusted text color
                          : "bg-blue-600 text-blue-100" // Default for processing, accepted, etc.
                  }`}
                >
                  {/* Display processed status, handle null */}
                  {order.status?.replace("_", " ") || "N/A"}
                </span>
              </div>
            </GlassDiv>
          ))}
        </div>
      )}
    </div>
  );
}
