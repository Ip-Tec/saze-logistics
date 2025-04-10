// components/vendor/Dashboard.tsx

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import OredrsList from "@/components/vendor/OrdersList";

const sampleData = [
  { date: "Apr 1", value: 400 },
  { date: "Apr 2", value: 460 },
  { date: "Apr 3", value: 520 },
  { date: "Apr 4", value: 300 },
  { date: "Apr 5", value: 650 },
];

export default function VendorDashboard() {
  const [totalOrders, setTotalOrders] = useState(145);
  const [totalRevenue, setTotalRevenue] = useState(27459);
  const [menuItems, setMenuItems] = useState(36);
  const [activeChart, setActiveChart] = useState<"revenue" | "orders">(
    "revenue"
  );

  useEffect(() => {
    // Fetch real data from NestJS API
  }, []);

  return (
    <div className="p-6 flex items-center justify-center gap-4 glass w-full h-full">
      <div className="p-6 flex flex-col gap-4 glass w-full h-full">
        {/* Cards */}
        <div className="flex md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md">
            <h2 className="text-sm text-gray-50 mb-2">Total Orders</h2>
            <p className="text-2xl font-semibold text-white">{totalOrders}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md">
            <h2 className="text-sm text-gray-50 mb-2">Total Revenue</h2>
            <p className="text-2xl font-semibold text-white">
              ₦{totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md">
            <h2 className="text-sm text-gray-50 mb-2">Active Menu Items</h2>
            <p className="text-2xl font-semibold text-white">{menuItems}</p>
          </div>
        </div>

        {/* Chart Section with Toggle */}
        <div className="w-full rounded-2xl bg-white/10 p-6 backdrop-blur border border-white/20 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">
              {activeChart === "revenue" ? "Revenue Chart" : "Orders Chart"}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveChart("revenue")}
                className={`px-4 py-1 rounded-full text-sm font-medium ${
                  activeChart === "revenue"
                    ? "bg-white text-black"
                    : "bg-white/10 text-white border border-white/30"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChart("orders")}
                className={`px-4 py-1 rounded-full text-sm font-medium ${
                  activeChart === "orders"
                    ? "bg-white text-black"
                    : "bg-white/10 text-white border border-white/30"
                }`}
              >
                Orders
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={
                activeChart === "revenue"
                  ? sampleData
                  : [
                      { date: "Apr 1", value: 12 },
                      { date: "Apr 2", value: 20 },
                      { date: "Apr 3", value: 18 },
                      { date: "Apr 4", value: 25 },
                      { date: "Apr 5", value: 30 },
                    ]
              }
            >
              <XAxis dataKey="date" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#333",
                  borderRadius: 10,
                  border: "none",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={activeChart === "revenue" ? "#4ADE80" : "#60A5FA"}
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Orders List */}
      <OredrsList />
    </div>
  );
}
