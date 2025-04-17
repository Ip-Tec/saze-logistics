"use client";

import dynamic from "next/dynamic";
import { Order } from "@shared/types";
import { useEffect, useState } from "react";
import GlassDiv from "@/components/ui/GlassDiv";
import GlassDivClickable from "@/components/ui/GlassDivClickable";

const MapWithNoSSR = dynamic(() => import("@/components/order/OrderMap"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
});

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    };

    fetchOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      <GlassDiv className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {orders.map((order) => (
          <GlassDivClickable
            key={order.id}
            className={`border rounded-xl p-4 cursor-pointer transition hover:shadow ${
              order.status === "in_transit"
                ? "border-green-500 ring-2 ring-green-300"
                : "border-gray-300"
            }`}
            onClick={() => setSelectedOrder(order)}
          >
            <p className="font-semibold">Order #{order.id.slice(0, 6)}</p>
            <p className="text-sm text-gray-500 capitalize">
              Status: {order.status}
            </p>
            <p className="text-orange-600 mt-1 font-semibold">
              ₦{order.totalAmount}
            </p>
          </GlassDivClickable>
        ))}
      </GlassDiv>

      {selectedOrder && (
        <div className="bg-white border rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold mb-2">
            Order #{selectedOrder.id.slice(0, 6)} Details
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Status: {selectedOrder.status}
          </p>

          <ul className="mb-4 list-disc list-inside text-sm text-gray-800">
            {selectedOrder.items.map((item, idx) => (
              <li key={idx}>
                {item.name} × {item.quantity}
              </li>
            ))}
          </ul>

          <p className="font-semibold text-orange-600">
            Total: ₦{selectedOrder.totalAmount}
          </p>

          {selectedOrder.status === "in_transit" &&
            selectedOrder.deliveryAddress?.coordinates && (
              <div className="mt-6">
                <h3 className="font-semibold text-md mb-2">Rider Location:</h3>
                <div className="h-64 w-full rounded-lg overflow-hidden">
                  <MapWithNoSSR
                    location={selectedOrder.deliveryAddress.coordinates}
                  />
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
