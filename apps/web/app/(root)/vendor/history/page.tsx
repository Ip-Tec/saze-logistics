"use client";

import React, { useState } from "react";

interface Order {
  id: string;
  customerName: string;
  items: string[];
  status: "pending" | "picked" | "cancelled";
  completedAt?: string;
}

const orderHistory: Order[] = [
  {
    id: "order3",
    customerName: "Alice Brown",
    items: ["Shawarma", "Pepsi"],
    status: "picked",
    completedAt: "2024-04-07",
  },
  {
    id: "order4",
    customerName: "Mike Stone",
    items: ["Rice", "Chicken"],
    status: "cancelled",
    completedAt: "2024-04-06",
  },
];

const VendorHistory = () => {
  const [showAll, setShowAll] = useState(false);
  const filteredOrders = showAll ? orderHistory : orderHistory.slice(0, 5);

  return (
    <div className="p-4 w-full mx-auto">
      <h2 className="text-3xl font-bold mb-6">Order History</h2>
      <div className="flex items-center justify-center gap-2">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow border border-gray-200 p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-lg font-semibold">Order ID: {order.id}</h3>
                <p className="text-sm text-gray-600">
                  Customer: {order.customerName}
                </p>
                {order.completedAt && (
                  <p className="text-xs text-gray-400">
                    Completed: {order.completedAt}
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-1 text-sm rounded-full capitalize ${
                  order.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : order.status === "picked"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {order.status}
              </span>
            </div>
            <ul className="list-disc pl-5 text-gray-700 text-sm">
              {order.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {orderHistory.length > 5 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            {showAll ? "Show Less" : "Show All"}
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorHistory;
