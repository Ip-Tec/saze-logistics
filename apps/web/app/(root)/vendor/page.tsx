"use client";

import React, { useState } from "react";

interface Order {
  id: string;
  customerName: string;
  items: string[];
  status: "pending" | "picked" | "cancelled";
}

const initialOrders: Order[] = [
  {
    id: "order1",
    customerName: "John Doe",
    items: ["Pizza", "Coke"],
    status: "pending",
  },
  {
    id: "order2",
    customerName: "Jane Smith",
    items: ["Burger", "Fries"],
    status: "pending",
  },
];

const VendorPage = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const updateOrderStatus = (id: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
  };

  return (
    <div className="p-4 w-full mx-auto">
      <h2 className="text-3xl font-bold mb-6">Vendor Dashboard</h2>
      <div className="flex flex-row items-center justify-center mb-6">
        {orders.map((order) => (
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
            <ul className="list-disc pl-5 text-gray-700 text-sm mb-3">
              {order.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            {order.status === "pending" && (
              <div className="flex gap-3">
                <button
                  onClick={() => updateOrderStatus(order.id, "picked")}
                  className="px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Pick Order
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, "cancelled")}
                  className="px-4 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorPage;
