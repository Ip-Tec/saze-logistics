// components/vendor/SalesOverview.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@shared/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface SalesOverviewProps {
  vendorId: string;
}

type ChartDataPoint = {
  date: string; // Formatted date string (e.g., "MM/DD")
  value: number; // Revenue for that date
};

// Helper for Date Formatting (adjust if needed for different granularities)
const formatDateForChart = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        // Format as MM/DD for 30-day view
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${month}/${day}`;
    } catch (e) {
        console.error("Error formatting date for chart:", dateString, e);
        return "N/A";
    }
};

const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "N/A";
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


export default function SalesOverview({ vendorId }: SalesOverviewProps) {
  const [totalSalesPeriod, setTotalSalesPeriod] = useState<number | null>(null); // Total sales for the chart period
  const [revenueChartData, setRevenueChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const now = new Date();
    // Calculate date for fetching last 30 days of data for charts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    try {
      // Fetch revenue data for delivered orders in the last 30 days
      const { data: chartOrdersData, error: chartOrdersError } = await supabase
        .from("order")
        .select("created_at, total_amount, status")
        .eq("vendor_id", vendorId)
        .eq("status", "delivered") // Only include delivered orders for revenue
        .gte("created_at", thirtyDaysAgo.toISOString()) // Filter for last 30 days
        .order("created_at", { ascending: true }); // Order for chronological processing

      if (chartOrdersError) throw chartOrdersError;

      // Aggregate chart data client-side
      const dailyRevenue: { [date: string]: number } = {};
      let totalRevPeriod = 0;

      if (chartOrdersData) {
        chartOrdersData.forEach((order) => {
          if (order.created_at && order.total_amount !== null) {
            // Use a date string like YYYY-MM-DD for consistent grouping
            const dateKey = order.created_at.split("T")[0]; // Gets YYYY-MM-DD
             // For chart display label, use MM/DD
            const formattedDate = formatDateForChart(order.created_at);

            dailyRevenue[formattedDate] =
              (dailyRevenue[formattedDate] || 0) + order.total_amount;

            totalRevPeriod += order.total_amount;
          }
        });
      }

      // Convert aggregated data to chart format and sort by date
      const revenueChart: ChartDataPoint[] = Object.keys(dailyRevenue)
        .map((date) => ({
          date: date,
          value: dailyRevenue[date],
        }))
        .sort((a, b) => {
            // Need to parse MM/DD dates to sort correctly
            const [monthA, dayA] = a.date.split('/').map(Number);
            const [monthB, dayB] = b.date.split('/').map(Number);
            // This sorting is basic; for spanning years, you'd need YYYY-MM-DD
            // For 30 days, MM/DD within the same year is usually fine if sorted correctly initially
            if (monthA !== monthB) return monthA - monthB;
            return dayA - dayB;
        });


      setRevenueChartData(revenueChart);
      setTotalSalesPeriod(totalRevPeriod);

    } catch (err: any) {
      console.error("Error fetching sales data:", err);
      setError(err.message || "Failed to load sales data.");
      setRevenueChartData([]);
      setTotalSalesPeriod(null);
      toast.error(err.message || "Failed to load sales data.");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  // Optional: Formatter for YAxis to show currency symbol
  const yAxisFormatter = (value: number) => {
      return `₦${value}`;
  }


  return (
    <div className="rounded-2xl bg-white/10 p-6 backdrop-blur border border-white/20 shadow-md flex-1 min-h-[400px]"> {/* Add min-height */}
      <h2 className="text-white font-semibold text-lg mb-4">Sales Overview</h2>

      {isLoading ? (
         <div className="flex w-full justify-center items-center h-full">
            <Loader2 size={24} className="animate-spin text-orange-500" />
            <p className="ml-2 text-gray-300">Loading sales data...</p>
         </div>
      ) : error ? (
         <div className="text-red-500 text-center">
            <p>{error}</p>
         </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-3xl font-bold text-white">
                {formatCurrency(totalSalesPeriod)}
            </p>
            <p className="text-sm text-gray-300">Total Sales (Last 30 Days)</p> {/* Adjust timeframe label */}
          </div>

          {revenueChartData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-300">
                No sales data available for this period.
              </div>
          ) : (
             <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={revenueChartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                    <XAxis dataKey="date" stroke="#ccc" tick={{ fill: '#ccc', fontSize: 12 }} />
                    {/* Add a formatter to YAxis if needed */}
                    <YAxis stroke="#ccc" tick={{ fill: '#ccc', fontSize: 12 }} formatter={yAxisFormatter} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#333",
                            borderRadius: 10,
                            border: "none",
                            color: "#fff"
                        }}
                        labelStyle={{ color: "#ddd" }}
                        itemStyle={{ color: "#fff" }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#FF6900" // Orange color from screenshot? Or match your theme
                        strokeWidth={2} // Slightly thinner line
                        dot={false} // No dots unless active
                        activeDot={{
                            r: 6,
                            stroke: "#FF6900",
                            fill: "#fff",
                            strokeWidth: 2,
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}

// Note: Consider moving formatCurrency and formatDateForChart to a shared utils file
