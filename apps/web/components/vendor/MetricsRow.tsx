// components/vendor/MetricsRow.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@shared/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface MetricsRowProps {
  vendorId: string;
}

type OrderStatusCount = {
  status: string;
  count: number | null;
};

const statusOrder = ["new", "processing", "out for delivery", "cancelled"]; // Define the desired order and keys

const statusDisplayNames: { [key: string]: string } = {
  new: "New Orders",
  processing: "Processing",
  "out for delivery": "Out for Delivery",
  cancelled: "Cancelled",
};

// Mapping status to icon/color (example - you might need actual icons)
const statusIcons: { [key: string]: React.JSX.Element } = {
  new: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-10 h-10 bg-orange-500 p-1 rounded-md text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m2.25-4.509V21M3.75 4.5v15m13.5 0L14.25 21m0 0l-2.625-2.625M3.75 4.5l-.375 2.25M3.75 4.5l.375 2.25m0 0L5.625 7.5m4.125 10.5l.375-2.25m-.375 2.25L9.75 19.5m0 0l-2.625-2.625M5.625 7.5l1.5 1.5m6 6l-1.5 1.5m-1.5 0l-1.5-1.5M10.5 18L9 16.5m11.25-4.5v7.5m-9-6h3m-3 0h-1.5m1.5 0v1.5m-1.5 0v1.5m0 1.5H9M9 16.5h1.5m-1.5 0v1.5"
      />
    </svg>
  ), // Example icon
  processing: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-10 h-10 bg-green-500 p-1 rounded-md text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  ),
  "out for delivery": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-10 h-10 bg-purple-800 p-1 rounded-md text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3 0A1.5 1.5 0 0 1 3 18.75v-7.5a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 11.25v7.5m-18 0h16.5a1.5 1.5 0 0 0 1.5-1.5v-7.5A1.5 1.5 0 0 0 19.5 9H3.75m15 0a9 9 0 1 0-16.5 5.25m16.5 0h.002"
      />
    </svg>
  ),
  cancelled: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-10 h-10 bg-red-500 p-1 rounded-md text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  ),
};

export default function MetricsRow({ vendorId }: MetricsRowProps) {
  const [metrics, setMetrics] = useState<OrderStatusCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedMetrics: OrderStatusCount[] = [];
      for (const status of statusOrder) {
        const { count, error } = await supabase
          .from("order")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", vendorId)
          .eq("status", status);

        if (error) throw error;
        fetchedMetrics.push({ status, count });
      }

      setMetrics(fetchedMetrics);
    } catch (err: any) {
      console.error(`Error fetching metrics:`, err);
      setError(err.message || "Failed to load metrics.");
      setMetrics([]);
      toast.error(err.message || "Failed to load metrics.");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-black/10 p-5 backdrop-blur border border-black/20 shadow-md h-28 animate-pulse"
            >
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center col-span-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map(({ status, count }) => (
        <div
          key={status}
          className="rounded-2xl bg-white/10 p-2.5 backdrop-blur border border-black/20 shadow-md h-28 w-full grid grid-cols-2 place-items-center"
        >
          <h2 className={`text-sm text-gray-900`}>
            {statusIcons[status]}
          </h2>
          <div className="grid grid-row-2 w-full m-auto place-items-start">
            {/* Add icon */}
            <div className="text-black text-2xl">{count !== null ? count : "N/A"}</div>
            <p className="opacity-70 text-sm">
              {statusDisplayNames[status] || status}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
