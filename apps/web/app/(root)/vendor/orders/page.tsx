"use client";

import GlassButton from "@/components/ui/GlassButton";
import GlassDiv from "@/components/ui/GlassDiv";
import React, { useState } from "react";

type Order = {
  id: string;
  customer: string;
  items: string[];
  total: number;
  time?: string;
  status?: string;
};

type OrdersData = {
  incoming: Order[];
  current: Order[];
  completed: Order[];
};

const VendorOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<keyof OrdersData>("incoming");

  const orders: OrdersData = {
    incoming: [
      {
        id: "ORD001",
        customer: "John Doe",
        items: ["Pizza", "Coke"],
        total: 3500,
        time: "2 mins ago",
      },
      {
        id: "ORD002",
        customer: "Jane Smith",
        items: ["Burger", "Fries"],
        total: 2800,
        time: "5 mins ago",
      },
      {
        id: "ORD003",
        customer: "John Doe",
        items: ["Pizza", "Coke"],
        total: 3500,
        time: "2 mins ago",
      },
      {
        id: "ORD004",
        customer: "Jane Smith",
        items: ["Burger", "Fries"],
        total: 2800,
        time: "5 mins ago",
      },
    ],
    current: [
      {
        id: "ORD005",
        customer: "Mike Tyson",
        items: ["Rice & Chicken"],
        total: 2500,
        status: "Preparing",
      },
    ],
    completed: [
      {
        id: "ORD006",
        customer: "Bella Rose",
        items: ["Pasta", "Juice"],
        total: 3200,
        status: "Delivered",
      },
      {
        id: "ORD007",
        customer: "Bella Rose",
        items: ["Pasta", "Juice"],
        total: 3200,
        status: "Delivered",
      },
    ],
    
  };

  const renderOrders = (list: Order[]) => (
    <div className="flex flex-wrap items-left gap-4 mt-4">
      {list.map((order) => (
        <GlassDiv
          key={order.id}
          className="rounded-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-lg">#{order.id}</span>
            <span className="text-xs text-gray-500">
              {order.time || order.status}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            <p>Customer: {order.customer}</p>
            <p>Items: {order.items.join(", ")}</p>
            <p>Total: ₦{order.total}</p>
          </div>
          {activeTab === "incoming" && (
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                Accept
              </button>
              <button className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                Reject
              </button>
            </div>
          )}
          {activeTab === "current" && (
            <div className="mt-4">
              <button className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                Mark as Ready
              </button>
            </div>
          )}
        </GlassDiv>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">Vendor Orders</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        {(["incoming", "current", "completed"] as (keyof OrdersData)[]).map(
          (tab) => (
            <GlassButton
              key={tab}
              className={`px-4 py-2 rounded ${
                activeTab === tab
                  ? "!bg-black text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "incoming"
                ? "Incoming"
                : tab === "current"
                  ? "In Progress"
                  : "Completed"}
            </GlassButton>
          )
        )}
      </div>

      {/* Orders */}
      {renderOrders(orders[activeTab])}
    </div>
  );
};

export default VendorOrdersPage;
