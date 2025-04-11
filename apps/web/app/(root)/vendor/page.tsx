"use client";

import React, { useState } from "react";
import Dashboard from "@/components/vendor/Dashboard";

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
    <Dashboard />
  );
};

export default VendorPage;
