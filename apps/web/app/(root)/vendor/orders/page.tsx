"use client"
import React, { useState } from "react";
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";
import GlassDivClickable from "@/components/ui/GlassDivClickable";

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);  // Track the selected order

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
        id: "ORD005",
        customer: "Jane Smith",
        items: ["Burger", "Fries"],
        total: 2800,
        time: "5 mins ago",
      },
      {
        id: "ORD006",
        customer: "Jane Smith",
        items: ["Burger", "Fries"],
        total: 2800,
        time: "5 mins ago",
      },
    ],
    current: [
      {
        id: "ORD003",
        customer: "Mike Tyson",
        items: ["Rice & Chicken"],
        total: 2500,
        status: "Preparing",
      },
      {
        id: "ORD008",
        customer: "Mike Tyson",
        items: ["Rice & Chicken"],
        total: 2500,
        status: "Preparing",
      },
    ],
    completed: [
      {
        id: "ORD004",
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
    <div className="flex flex-wrap items-left justify-center gap-4 my-4 pb-36">
      {list.map((order) => (
        <GlassDivClickable
          key={order.id}
          className="w-full"
          onClick={() => setSelectedOrder(order)}  // Handle the click to set the selected order
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
              <GlassButton className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                Accept
              </GlassButton>
              <GlassButton className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                Reject
              </GlassButton>
            </div>
          )}
          {activeTab === "current" && (
            <div className="mt-4">
              <GlassButton className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                Mark as Ready
              </GlassButton>
            </div>
          )}
        </GlassDivClickable>
      ))}
    </div>
  );

  return (
    <div className="p-6 w-full h-full">
      <h1 className="text-2xl font-bold mb-6 text-white">Vendor Orders</h1>

      {/* Tabs */}
      <GlassDiv className="flex space-x-4 mb-4 w-auto">
        {(["incoming", "current", "completed"] as (keyof OrdersData)[]).map(
          (tab) => (
            <GlassButton
              key={tab}
              className={`px-4 py-2 rounded !shadow-none ${activeTab === tab ? "!bg-black text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "incoming" ? "Incoming" : tab === "current" ? "In Progress" : "Completed"}
            </GlassButton>
          )
        )}
      </GlassDiv>

      <div className="flex gap-6 h-full">
        {/* Orders Column */}
        <div className="flex-1 w-2/3 !h-full !overflow-y-scroll glass-scrollbar">
          {renderOrders(orders[activeTab])}
        </div>

        {/* Order Details Column */}
        <div className="w-1/3">
          <GlassDiv className="p-4 rounded-2xl shadow-lg bg-gray-100">
            <h3 className="text-xl font-semibold mb-4">Order Details</h3>
            {selectedOrder ? (
              <div>
                <p className="font-bold">Order ID: {selectedOrder.id}</p>
                <p className="font-medium">Customer: {selectedOrder.customer}</p>
                <p>Items: {selectedOrder.items.join(", ")}</p>
                <p>Total: ₦{selectedOrder.total}</p>
                <p>Status: {selectedOrder.status || "Not yet started"}</p>
                <p>Location: {/* Add location data here if available */}</p>
              </div>
            ) : (
              <p className="text-gray-500">Click an order to see its details.</p>
            )}
          </GlassDiv>
        </div>
      </div>
    </div>
  );
};

export default VendorOrdersPage;
