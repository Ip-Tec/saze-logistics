// app/admin/orders/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";
import { toast, ToastContainer } from "react-toastify";

type OrderRow = Database["public"]["Tables"]["order"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AddressRow = Database["public"]["Tables"]["delivery_address"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_item"]["Row"];
type MenuItemRow = Database["public"]["Tables"]["menu_item"]["Row"];

interface OrderWithRelations extends OrderRow {
  user: ProfileRow;
  vendor: ProfileRow;
  rider: ProfileRow | null;
  delivery_address: AddressRow | null;
}

interface OrderItemWithMenu extends OrderItemRow {
  menu_item: MenuItemRow | null;
}

export default function OrderDetailPage() {
  const { id } = useParams(); // order ID
  const router = useRouter();

  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [items, setItems] = useState<OrderItemWithMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    async function fetchData() {
      // 1) fetch order + relations
      const { data: o, error: oe } = await supabase
        .from("order")
        .select(
          `*, user:profiles!order_user_id_fkey (id, name), vendor:profiles!order_vendor_id_fkey (id, name), rider:profiles!order_rider_id_fkey (id, name), delivery_address (street, city, state)`
        )
        .eq("id", id)
        .single();

      if (oe || !o) {
        setError(oe?.message || "Order not found");
        setLoading(false);
        return;
      }

      // 2) fetch items with menu details
      const { data: its, error: ie } = await supabase
        .from("order_item")
        .select(
          `
          *,
          menu_item (id, name, price)
        `
        )
        .eq("order_id", id);

      if (ie) {
        setError(ie.message);
      } else {
        setOrder(o);
        setItems(its || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) return <div className="p-4">Loading order…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!order) return null;

  // Compute next status transitions
  const NEXT: Record<string, string> = {
    pending: "assigned",
    assigned: "delivered",
    delivered: "completed",
    completed: "completed",
  };
  const nextStatus =
    NEXT[order.status == null ? "" : order.status] || "pending";

  // Handle status update
  const updateStatus = async () => {
    const { error } = await supabase
      .from("order")
      .update({ status: nextStatus })
      .eq("id", id);
    if (error) {
      toast.error("Error updating status: " + error.message);
    } else {
      router.refresh();
    }
  };

  // Table columns for items
  const itemColumns = [
    {
      header: "Item",
      accessor: (i: OrderItemWithMenu) => i.menu_item?.name ?? "Unknown",
    },
    { header: "Qty", accessor: (i: OrderItemWithMenu) => i.quantity },
    { header: "Price", accessor: (i: OrderItemWithMenu) => i.price.toFixed(2) },
    {
      header: "Subtotal",
      accessor: (i: OrderItemWithMenu) => (i.price * i.quantity).toFixed(2),
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <ToastContainer />
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline"
      >
        ← Back to Orders
      </button>

      {/* Order Summary */}
      <div className="bg-white shadow rounded p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Order #{order.id}</h2>
          <p>
            <strong>Customer:</strong> {order.user.name} ({order.user.email})
          </p>
          <p>
            <strong>Vendor:</strong> {order.vendor.name}
          </p>
          <p>
            <strong>Rider:</strong> {order.rider?.name ?? "Unassigned"}
          </p>
        </div>
        <div>
          <p>
            <strong>Payment:</strong> {order.payment_method} /{" "}
            {order.payment_status}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={
                order.status === "pending"
                  ? "text-yellow-600"
                  : order.status === "assigned"
                    ? "text-blue-600"
                    : order.status === "delivered"
                      ? "text-green-600"
                      : "text-gray-600"
              }
            >
              {order.status}
            </span>
          </p>
          <p>
            <strong>Total:</strong> ₦{order.total_amount.toFixed(2)}
          </p>
          {order.delivery_address && (
            <p>
              <strong>Address:</strong>
              <br />
              {order.delivery_address.street}, {order.delivery_address.city},{" "}
              {order.delivery_address.state}{" "}
              {order.delivery_address.postal_code}
            </p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Items</h3>
        <DataTable columns={itemColumns} data={items} />
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {order.status !== "completed" && (
          <ActionButton
            label={`Mark ${nextStatus}`}
            onClick={updateStatus}
            colorClass="bg-blue-600 text-white"
          />
        )}
        <ActionButton
          label="Refund"
          onClick={() => alert("Refund logic here")}
          colorClass="bg-red-600 text-white"
        />
      </div>
    </div>
  );
}
