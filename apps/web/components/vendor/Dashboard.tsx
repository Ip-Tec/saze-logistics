// components/vendor/Dashboard.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import OredrsList from "@/components/vendor/OrdersList";
import { supabase } from "@shared/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

// --- Type Definitions ---

// Type for the raw data needed for metrics/charts
// This mirrors the fields you select from the 'order' table for aggregation
type OrderMetricQueryResult = {
  created_at: string | null;
  total_amount: number | null; // Make nullable based on DB type
  status: string | null;
};

// Type for the raw data needed for the menu item count
type MenuItemCountQueryResult = {
  id: string;
  is_available: boolean | null;
};

// Type for processed chart data points
type ChartDataPoint = {
  date: string; // Formatted date string (e.g., "MM/DD")
  value: number; // Revenue or order count for that date
};

// --- Helper for Date Formatting ---
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    // Format as MM/DD
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${month}/${day}`;
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return "N/A";
  }
};

// --- Component ---

export default function VendorDashboard() {
  const { user } = useAuthContext();

  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [activeMenuItemsCount, setActiveMenuItemsCount] = useState<
    number | null
  >(null);
  const [revenueChartData, setRevenueChartData] = useState<ChartDataPoint[]>(
    []
  );
  const [ordersChartData, setOrdersChartData] = useState<ChartDataPoint[]>([]);

  const [activeChart, setActiveChart] = useState<"revenue" | "orders">(
    "revenue"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---

  const fetchData = useCallback(async () => {
    console.log({ user });
    if (!user?.id) {
      // Ensure user is logged in
      setError("Vendor not logged in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const vendorId = user.id;
    const now = new Date();
    // Calculate date for fetching last 30 days of data for charts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    try {
      // 1. Fetch Total Orders & Total Revenue (e.g., for all time or a specific period)
      // Let's fetch for 'completed' orders for revenue, maybe all for total orders
      const { count: ordersCount, error: ordersCountError } = await supabase
        .from("order")
        .select("*", { count: "exact", head: true }) // Just count, don't fetch data
        .eq("vendor_id", vendorId);

      if (ordersCountError) throw ordersCountError;
      setTotalOrders(ordersCount);

      // For total revenue, sum total_amount for 'delivered' orders
      const { data: revenueData, error: revenueError } = await supabase
        .from("order")
        .select("total_amount")
        .eq("vendor_id", vendorId)
        .eq("status", "delivered"); // Only sum delivered orders for revenue

      if (revenueError) throw revenueError;
      // Calculate the sum client-side from the fetched amounts
      const totalRev =
        revenueData?.reduce(
          (sum, order) => sum + (order.total_amount || 0),
          0
        ) || 0;
      setTotalRevenue(totalRev);

      // 2. Fetch Active Menu Items Count
      const { count: menuItemsCount, error: menuItemsCountError } =
        await supabase
          .from("menu_item")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", vendorId)
          .eq("is_available", true); // Count only available items

      if (menuItemsCountError) throw menuItemsCountError;
      setActiveMenuItemsCount(menuItemsCount);

      // 3. Fetch Data for Charts (Orders & Revenue over last 30 days)
      const { data: chartOrdersData, error: chartOrdersError } = await supabase
        .from("order")
        .select("created_at, total_amount, status")
        .eq("vendor_id", vendorId)
        .gte("created_at", thirtyDaysAgo.toISOString()) // Filter for last 30 days
        .order("created_at", { ascending: true }); // Order for chronological processing

      if (chartOrdersError) throw chartOrdersError;

      // Aggregate chart data client-side
      const dailyRevenue: { [date: string]: number } = {};
      const dailyOrders: { [date: string]: number } = {};

      if (chartOrdersData) {
        chartOrdersData.forEach((order) => {
          if (order.created_at) {
            // Use a date string like YYYY-MM-DD for consistent grouping
            const dateKey = order.created_at.split("T")[0]; // Gets YYYY-MM-DD
            const formattedDate = formatDate(order.created_at); // For chart display label

            // Aggregate Orders (count all orders in period)
            dailyOrders[formattedDate] = (dailyOrders[formattedDate] || 0) + 1;

            // Aggregate Revenue (sum only delivered orders)
            if (order.status === "delivered" && order.total_amount !== null) {
              dailyRevenue[formattedDate] =
                (dailyRevenue[formattedDate] || 0) + order.total_amount;
            }
          }
        });
      }

      // Convert aggregated data to chart format
      const revenueChart: ChartDataPoint[] = Object.keys(dailyRevenue)
        .map((date) => ({
          date: date,
          value: dailyRevenue[date],
        }))
        .sort((a, b) => (new Date(a.date) as any) - (new Date(b.date) as any)); // Sort by date

      const ordersChart: ChartDataPoint[] = Object.keys(dailyOrders)
        .map((date) => ({
          date: date,
          value: dailyOrders[date],
        }))
        .sort((a, b) => (new Date(a.date) as any) - (new Date(b.date) as any)); // Sort by date

      setRevenueChartData(revenueChart);
      setOrdersChartData(ordersChart);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data.");
      // Clear data on error
      setTotalOrders(null);
      setTotalRevenue(null);
      setActiveMenuItemsCount(null);
      setRevenueChartData([]);
      setOrdersChartData([]);
      toast.error(err.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); // Dependency on user ID

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Effect depends on the fetchData callback

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center h-screen">
        {/* Use h-screen for full page loader */}
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-gray-700">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-orange-500 text-center mt-8">
        <p>{error}</p>
        <p>Could not load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="md:p-6 flex flex-col-reverse md:flex-row items-stretch gap-4 w-full h-full overflow-y-auto glass-scrollbar">
      {/* Changed to a responsive grid */}
      <div className="grid grid-rows-2 gap-4 w-full md:w-[70%] ">
        <div className="grid grid-cols-3 gap-4 h-28">
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md">
            <h2 className="text-sm text-gray-50 mb-2">Total Orders</h2>
            {/* Display fetched totalOrders, handle null state */}
            <p className="text-2xl font-semibold text-white">
              {totalOrders !== null ? totalOrders : "N/A"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md">
            <h2 className="text-sm text-gray-50 mb-2">Total Revenue</h2>
            {/* Display fetched totalRevenue, handle null state, format as currency */}
            <p className="text-2xl font-semibold text-white">
              ₦
              {totalRevenue !== null
                ? totalRevenue.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "N/A"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md">
            <h2 className="text-sm text-gray-50 mb-2">Active Menu Items</h2>
            {/* Display fetched activeMenuItemsCount, handle null state */}
            <p className="text-2xl font-semibold text-white">
              {activeMenuItemsCount !== null ? activeMenuItemsCount : "N/A"}
            </p>
          </div>
        </div>

        {/* Chart Section with Toggle */}
        <div className="w-full rounded-2xl bg-white/10 p-6 backdrop-blur border border-white/20 shadow-md flex-1 min-h-0">
          {/* Added flex-1 min-h-0 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">
              {activeChart === "revenue"
                ? "Revenue Chart (Last 30 Days)"
                : "Orders Chart (Last 30 Days)"}
              {/* Added timeframe */}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveChart("revenue")}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeChart === "revenue"
                    ? "bg-white text-black"
                    : "bg-white/10 text-white border border-white/30 hover:bg-white/20"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChart("orders")}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeChart === "orders"
                    ? "bg-white text-black"
                    : "bg-white/10 text-white border border-white/30 hover:bg-white/20"
                }`}
              >
                Orders
              </button>
            </div>
          </div>
          {/* Render charts only if data is available for the active chart type */}
          {(activeChart === "revenue" && revenueChartData.length === 0) ||
          (activeChart === "orders" && ordersChartData.length === 0) ? (
            <div className="flex items-center justify-center h-full text-gray-300">
              No data available for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={
                  activeChart === "revenue"
                    ? revenueChartData // Use fetched data
                    : ordersChartData // Use fetched data
                }
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }} // Adjust margins if needed
              >
                <XAxis dataKey="date" stroke="#fff" />
                {/* Add a formatter to YAxis if needed, e.g., for currency */}
                <YAxis stroke="#fff" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#333",
                    borderRadius: 10,
                    border: "none",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  // Optional: Add a formatter to the tooltip
                  formatter={(value: number, name: string) => {
                    if (activeChart === "revenue") {
                      return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                    return value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value" // Use 'value' as defined in ChartDataPoint
                  stroke={activeChart === "revenue" ? "#4ADE80" : "#FF6900"}
                  strokeWidth={3}
                  dot={{ r: 4 }} // Add dots
                  activeDot={{
                    r: 8,
                    stroke: activeChart === "revenue" ? "#4ADE80" : "#FF6900",
                    fill: "#fff",
                  }} // Larger dot on hover
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* OredrsList component - assumes this is used elsewhere or needs to be integrated */}
      {/* If you want to display recent orders below the chart, uncomment and integrate OredrsList */}
      <OredrsList />
    </div>
  );
}
