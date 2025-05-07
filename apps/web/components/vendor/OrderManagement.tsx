// components/vendor/OrderManagement.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@shared/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface OrderManagementProps {
  vendorId: string;
}

type RecentOrder = {
  id: string;
  status: string | null;
  created_at: string | null;
  total_amount: number | null;
};

// Helper to format date (consider putting this in a shared utility file)
const formatOrderDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`; // MM/DD/YYYY format
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "N/A";
    }
};

const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "N/A";
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


export default function OrderManagement({ vendorId }: OrderManagementProps) {
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch recent orders, e.g., the last 5
      const { data, error } = await supabase
        .from("order")
        .select("id, status, created_at, total_amount")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false }) // Latest first
        .limit(5); // Get the last 5 orders

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (err: any) {
      console.error("Error fetching recent orders:", err);
      setError(err.message || "Failed to load recent orders.");
      setRecentOrders([]);
      toast.error(err.message || "Failed to load recent orders.");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  // Helper for status badge styling (example - adjust colors as needed)
  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "processing":
        return "bg-yellow-500";
      case "out for delivery":
         return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };


  return (
    <div className="rounded-2xl bg-white/10 p-6 backdrop-blur border border-black/20 shadow-md flex-1">
      <h2 className="text-black font-semibold text-lg mb-4">Order Management</h2>

      {isLoading ? (
        <div className="flex w-full justify-center items-center h-40">
          <Loader2 size={24} className="animate-spin text-orange-500" />
          <p className="ml-2 text-gray-500">Loading orders...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">
          <p>{error}</p>
        </div>
      ) : recentOrders.length === 0 ? (
         <div className="text-gray-300 text-center">No recent orders found.</div>
      ) : (
        <div className="overflow-x-auto"> {/* Add horizontal scroll for small screens */}
          <table className="w-full text-left text-sm text-gray-200">
            <thead className="text-xs text-gray-50 uppercase bg-white/5">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Order ID
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Placed On
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/10">
                  <th scope="row" className="px-4 py-3 font-medium text-white whitespace-nowrap">
                    #{order.id.substring(0, 6)} {/* Shorten ID */}
                  </th>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusBadgeClass(order.status)}`}>
                        {order.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {formatOrderDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Note: Move formatDate and formatCurrency helpers to a shared utils file if used elsewhere
// Example: utils/formatters.ts
// export const formatOrderDate = ...
// export const formatCurrency = ...
