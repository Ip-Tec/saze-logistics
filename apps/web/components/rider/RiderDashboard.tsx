// apps/web/app/(root)/rider/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import RiderOrderList from "@/components/rider/RiderOrderList";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@shared/supabaseClient";
import { Loader2 } from "lucide-react";

// Define types for fetched recent orders (subset of Order type from history/current)
type RecentOrder = {
  id: string;
  total_amount: number;
  status: string | null;
  created_at: string | null;
  // Select only name for customer profile
  user_id: { name: string | null } | null;
  // Select relevant address fields for summary
  delivery_address_id: { street: string | null; city: string | null } | null;
};

// Define type for chart data
type ChartDataPoint = {
  date: string;
  value: number; // Represents count of deliveries for that date
};

export default function RiderDashboard() {
  const { user } = useAuthContext(); // Get the logged-in user (rider)

  // State for aggregated stats
  const [totalDeliveries, setTotalDeliveries] = useState<number | null>(null);
  const [totalEarn, setTotalEarn] = useState<number | null>(null);
  // Note: Total Distance and Delivery Rating are not directly in your DB schema.
  // You would need additional tables/logic to calculate these. Keeping as placeholders for now.
  const [totalDistance, setTotalDistance] = useState<number | null>(null); // in km
  const [deliveryRating, setDeliveryRating] = useState<number | null>(null); // out of 5

  // State for chart data
  const [deliveriesChartData, setDeliveriesChartData] = useState<
    ChartDataPoint[]
  >([]);
  // We'll focus on deliveries chart based on available data
  const [activeChart, setActiveChart] = useState<"deliveries" | "distance">(
    "deliveries"
  ); // Only deliveries chart for now

  // State for recent orders list
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);
  const [errorChart, setErrorChart] = useState<string | null>(null);
  const [errorRecent, setErrorRecent] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    if (!user) {
      setErrorStats("User not logged in.");
      setErrorChart("User not logged in.");
      setErrorRecent("User not logged in.");
      setIsLoadingStats(false);
      setIsLoadingChart(false);
      setIsLoadingRecent(false);
      return;
    }

    const riderId = user.id;

    // --- Fetch Aggregated Stats ---
    const fetchStats = async () => {
      setIsLoadingStats(true);
      setErrorStats(null);
      try {
        // Fetch total delivered count
        const { count: deliveredCount, error: countError } = await supabase
          .from("order")
          .select("*", { count: "exact", head: true }) // Use head: true to get count in headers
          .eq("rider_id", riderId)
          .eq("status", "delivered");

        if (countError) throw countError;
        setTotalDeliveries(deliveredCount);

        // Fetch total earnings (sum of total_amount for delivered orders)
        const { data: earningsData, error: earningsError } = await supabase
          .from("order")
          .select("total_amount")
          .eq("rider_id", riderId)
          .eq("status", "delivered");

        if (earningsError) throw earningsError;

        const totalEarnings = earningsData.reduce(
          (sum, order) => sum + order.total_amount,
          0
        );
        setTotalEarn(totalEarnings);

        // Keep placeholders for distance and rating for now
        setTotalDistance(null); // Data not available
        setDeliveryRating(null); // Data not available
      } catch (err: any) {
        console.error("Error fetching rider stats:", err);
        setErrorStats("Failed to load stats.");
        setTotalDeliveries(null);
        setTotalEarn(null);
        setTotalDistance(null);
        setDeliveryRating(null);
      } finally {
        setIsLoadingStats(false);
      }
    };

    // --- Fetch Chart Data (Delivered Count per Day - Last 30 Days) ---
    const fetchChartData = async () => {
      setIsLoadingChart(true);
      setErrorChart(null);
      try {
        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        // Fetch delivered orders in the last 30 days
        const { data: ordersData, error: ordersError } = await supabase
          .from("order")
          .select("created_at")
          .eq("rider_id", riderId)
          .eq("status", "delivered")
          .gte("created_at", thirtyDaysAgoISO) // Filter for last 30 days
          .order("created_at", { ascending: true }); // Order by date for processing

        if (ordersError) throw ordersError;

        // Process data to count deliveries per day
        const dailyCounts: { [key: string]: number } = {};
        ordersData.forEach((order) => {
          if (order.created_at) {
            // Extract date part (YYYY-MM-DD)
            const date = new Date(order.created_at).toISOString().split("T")[0];
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
          }
        });

        // Convert to chart data format, ensuring all dates in the range are included (with 0 if no deliveries)
        const chartData: ChartDataPoint[] = [];
        let currentDate = new Date(thirtyDaysAgo);
        while (currentDate <= new Date()) {
          const dateString = currentDate.toISOString().split("T")[0];
          // Format date for display (e.g., "Apr 1")
          const displayDate = currentDate.toLocaleDateString("en-NG", {
            month: "short",
            day: "numeric",
          });
          chartData.push({
            date: displayDate,
            value: dailyCounts[dateString] || 0,
          });
          currentDate.setDate(currentDate.getDate() + 1); // Move to next day
        }

        setDeliveriesChartData(chartData);
      } catch (err: any) {
        console.error("Error fetching rider chart data:", err);
        setErrorChart("Failed to load chart data.");
        setDeliveriesChartData([]);
      } finally {
        setIsLoadingChart(false);
      }
    };

    // --- Fetch Recent Orders List ---
    const fetchRecentOrders = async () => {
      setIsLoadingRecent(true);
      setErrorRecent(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("order")
          .select(
            `id,
            total_amount,
            status,
            created_at,
            user_id (name),
            delivery_address_id (street, city)
            `
          )
          .eq("rider_id", riderId) // Filter by the logged-in rider's ID
          .order("created_at", { ascending: true }) // Order by newest first
          .limit(15); // Limit to the 5 most recent orders

        if (fetchError) throw fetchError;

        // Supabase select with relationships like user_id(name) might return an array
        // We need to process the data to flatten these relationships if they come as arrays.
        const processedData: RecentOrder[] = data
          ? data.map((order) => ({
              ...order,
              // Extract the first element from the arrays, or null if the array is null or empty
              user_id:
                order.user_id && order.user_id.length > 0
                  ? order.user_id[0]
                  : null,
              delivery_address_id:
                order.delivery_address_id &&
                order.delivery_address_id.length > 0
                  ? order.delivery_address_id[0]
                  : null,
            }))
          : [];

        setRecentOrders(processedData);
      } catch (err: any) {
        console.error("Error fetching recent orders:", err);
        setErrorRecent("Failed to load recent orders.");
        setRecentOrders([]);
      } finally {
        setIsLoadingRecent(false);
      }
    };

    // Execute all fetch functions
    fetchStats();
    fetchChartData();
    fetchRecentOrders();
  }, [user]); // Re-run effect if user changes (supabase client instance from import should be stable)

  // Helper to format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
    return `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // --- Render ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-8 w-full h-full text-gray-800 overflow-y-auto glass-scrollbar">
      {" "}
      {/* Adjusted grid for layout */}
      {/* Left Column (Stats and Chart) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {" "}
        {/* Span 2 columns on large screens */}
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {" "}
          {/* Adjusted grid for stats */}
          {isLoadingStats ? (
            <div className="col-span-full flex justify-center items-center p-8">
              <Loader2
                size={24}
                className="animate-spin text-orange-500 mr-2"
              />
              Loading Stats...
            </div>
          ) : errorStats ? (
            <div className="col-span-full text-red-600 text-center p-8">
              {errorStats}
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-md">
                <h2 className="text-sm text-gray-600 mb-2">Total Deliveries</h2>
                <p className="text-2xl font-semibold">
                  {totalDeliveries !== null ? totalDeliveries : "N/A"}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-md">
                <h2 className="text-sm text-gray-600 mb-2">Total Earnings</h2>
                <p className="text-2xl font-semibold">
                  {formatCurrency(totalEarn)}
                </p>
              </div>
              {/* Placeholders for data not in schema */}
              <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-md opacity-60">
                {" "}
                {/* Dim placeholders */}
                <h2 className="text-sm text-gray-600 mb-2">Total Distance</h2>
                <p className="text-2xl font-semibold">
                  {totalDistance !== null ? `${totalDistance} km` : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {" "}
                  (Requires tracking data)
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-md opacity-60">
                {" "}
                {/* Dim placeholders */}
                <h2 className="text-sm text-gray-600 mb-2">Delivery Rating</h2>
                <p className="text-2xl font-semibold">
                  {deliveryRating !== null ? `${deliveryRating} ⭐` : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {" "}
                  (Requires rating system)
                </p>
              </div>
            </>
          )}
        </div>
        {/* Chart Section */}
        <div className="w-full rounded-2xl bg-white p-6 border border-gray-200 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-semibold">
              {activeChart === "deliveries"
                ? "Delivered Orders (Last 30 Days)"
                : "Distance Traveled (Last 30 Days)"}
              {/* Adjusted title */}
            </h2>
            {/* Removed distance chart button as data is not available */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveChart("deliveries")}
                className={`px-4 py-1 rounded-full text-sm font-medium ${
                  activeChart === "deliveries"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 border border-gray-300"
                }`}
              >
                Deliveries
              </button>
              {/* Removed distance chart button */}
              <button
                onClick={() => setActiveChart("distance")}
                className={`px-4 py-1 rounded-full text-sm font-medium ${
                  activeChart === "distance"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 border border-gray-300"
                }`}
              >
                Distance
              </button>
            </div>
          </div>

          {isLoadingChart ? (
            <div className="flex justify-center items-center h-[300px]">
              <Loader2
                size={24}
                className="animate-spin text-orange-500 mr-2"
              />
              Loading Chart Data...
            </div>
          ) : errorChart ? (
            <div className="text-red-600 text-center h-[300px] flex items-center justify-center">
              {errorChart}
            </div>
          ) : deliveriesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={deliveriesChartData}>
                <XAxis dataKey="date" stroke="#555" />
                <YAxis stroke="#555" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f9f9f9",
                    borderRadius: 10,
                    border: "1px solid #ccc",
                  }}
                  labelStyle={{ color: "#333" }}
                  itemStyle={{ color: "#333" }}
                  formatter={(value: number) => [value, "Deliveries"]} // Custom tooltip formatter
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4ADE80" // Green color for deliveries
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-600 text-center h-[300px] flex items-center justify-center">
              No delivery data for the last 30 days.
            </div>
          )}
        </div>
      </div>
      {/* Right Column (Recent Deliveries List) */}
      {/* Pass recentOrders data and loading/error states as props */}
      <div className="lg:col-span-1 w-full">
        {/* Take 1 column on large screens */}
        <RiderOrderList
          orders={recentOrders}
          isLoading={isLoadingRecent}
          error={errorRecent}
        />
      </div>
    </div>
  );
}
