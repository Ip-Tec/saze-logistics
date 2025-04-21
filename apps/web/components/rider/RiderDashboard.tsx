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

const sampleData = [
  { date: "Apr 1", value: 12 },
  { date: "Apr 2", value: 18 },
  { date: "Apr 3", value: 22 },
  { date: "Apr 4", value: 15 },
  { date: "Apr 5", value: 28 },
];

export default function RiderDashboard() {
  const [totalDeliveries, setTotalDeliveries] = useState(89);
  const [totalDistance, setTotalDistance] = useState(124.7); // in km
  const [deliveryRating, setDeliveryRating] = useState(4.8); // out of 5
  const [totalEarn, setTotalEarn] = useState("40,000"); // out of 5
  const [activeChart, setActiveChart] = useState<"deliveries" | "distance">(
    "deliveries"
  );

  useEffect(() => {
    // Fetch real data from backend here
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2  justify-items-end w-full h-auto text-gray-800">
      <div className="sm:w-full p-4 flex flex-col gap-4 h-auto">
        {/* Stat Cards */}
        <div className="flex md:grid-cols-3 gap-4 w-auto overflow-x-auto">
          <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-md">
            <h2 className="text-sm text-gray-600 mb-2">Total Deliveries</h2>
            <p className="text-2xl font-semibold">{totalDeliveries}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-md">
            <h2 className="text-sm text-gray-600 mb-2">Total Distance</h2>
            <p className="text-2xl font-semibold">{totalDistance} km</p>
          </div>
          <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-md">
            <h2 className="text-sm text-gray-600 mb-2">Delivery Rating</h2>
            <p className="text-2xl font-semibold">{deliveryRating} ⭐</p>
          </div>
          <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-md">
            <h2 className="text-sm text-gray-600 mb-2">Total Earn</h2>
            <p className="text-2xl font-semibold">{totalEarn} ⭐</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="w-full rounded-2xl bg-white p-6 border border-gray-200 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-semibold">
              {activeChart === "deliveries"
                ? "Deliveries Overview"
                : "Distance Travelled Overview"}
            </h2>
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

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={
                activeChart === "deliveries"
                  ? sampleData
                  : [
                      { date: "Apr 1", value: 7.2 },
                      { date: "Apr 2", value: 12.5 },
                      { date: "Apr 3", value: 9.8 },
                      { date: "Apr 4", value: 14.1 },
                      { date: "Apr 5", value: 11.7 },
                    ]
              }
            >
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
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={activeChart === "deliveries" ? "#4ADE80" : "#FACC15"}
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rider Delivery List */}
        <RiderOrderList />
    </div>
  );
}
