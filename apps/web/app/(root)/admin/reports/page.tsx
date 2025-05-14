// app/admin/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";

type OrderRow = Database["public"]["Tables"]["order"]["Row"];

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch last 30 days of orders
      const { data: orders, error } = await supabase
        .from("order")
        .select("created_at, total_amount")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        );

      if (error || !orders) {
        console.error("Error fetching orders:", error);
        setLoading(false);
        return;
      }

      // Aggregate per day
      const map: Record<string, DailyStats> = {};
      let totOrders = 0,
        totRev = 0;

      orders.forEach((o) => {
        const day = new Date(o.created_at!).toISOString().slice(0, 10);
        if (!map[day]) map[day] = { date: day, orders: 0, revenue: 0 };
        map[day].orders += 1;
        map[day].revenue += o.total_amount;
        totOrders += 1;
        totRev += o.total_amount;
      });

      // Fill missing days
      const arr: DailyStats[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = d.toISOString().slice(0, 10);
        arr.push(map[day] || { date: day, orders: 0, revenue: 0 });
      }

      setStats(arr);
      setTotalOrders(totOrders);
      setTotalRevenue(totRev);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading)
    return <div className="p-4 text-gray-600">Loading analytics…</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Analytics & Reports</h1>

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Total Orders (30d)
          </h3>
          <p className="text-2xl font-semibold">{totalOrders}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Total Revenue (30d)
          </h3>
          <p className="text-2xl font-semibold">₦{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Active Riders</h3>
          <p className="text-2xl font-semibold">
            {/* Placeholder: count distinct rider_id */}–
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Active Vendors</h3>
          <p className="text-2xl font-semibold">
            {/* Placeholder: count distinct vendor_id */}–
          </p>
        </div>
      </div>

      {/* 2. Daily Orders Line Chart */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">
          Daily Orders (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="orders" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Daily Revenue Bar Chart */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">
          Daily Revenue (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
