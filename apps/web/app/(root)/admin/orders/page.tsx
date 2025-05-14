// app/admin/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";
import { toast, ToastContainer } from "react-toastify";

type OrderRow = Database["public"]["Tables"]["order"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AddressRow = Database["public"]["Tables"]["delivery_address"]["Row"];

interface OrderWithRelations extends OrderRow {
  user: ProfileRow;
  vendor: ProfileRow;
  rider: ProfileRow | null;
  delivery_address: AddressRow | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  const fetchOrders = async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch orders with related profiles and address
    const { data, error, count } = await supabase
      .from("order")
      .select(
        `
        *,
        user:profiles!order_user_id_fkey (id, name),
        vendor:profiles!order_vendor_id_fkey (id, name),
        rider:profiles!order_rider_id_fkey (id, name),
        delivery_address (street, city, state)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error loading orders:", error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Update order status
  const updateStatus = async (id: string, nextStatus: string) => {
    const { error } = await supabase
      .from("order")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      toast("Failed to update status: " + error.message);
    } else {
      fetchOrders();
    }
  };

  const columns = [
    {
      header: "Order ID",
      accessor: (o: OrderWithRelations) => o.id,
    },
    {
      header: "Customer",
      accessor: (o: OrderWithRelations) => o.user?.name ?? "—",
    },
    {
      header: "Vendor",
      accessor: (o: OrderWithRelations) => o.vendor?.name ?? "—",
    },
    {
      header: "Rider",
      accessor: (o: OrderWithRelations) => o.rider?.name ?? "Unassigned",
    },
    {
      header: "Amount (₦)",
      accessor: (o: OrderWithRelations) => o.total_amount.toFixed(2),
    },
    {
      header: "Address",
      accessor: (o: OrderWithRelations) =>
        o.delivery_address
          ? `${o.delivery_address.street}, ${o.delivery_address.city}`
          : "—",
    },
    {
      header: "Status",
      accessor: (o: OrderWithRelations) => (
        <span
          className={
            o.status === "pending"
              ? "text-yellow-600"
              : o.status === "assigned"
                ? "text-blue-600"
                : o.status === "delivered"
                  ? "text-green-600"
                  : "text-gray-600"
          }
        >
          {o.status}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (o: OrderWithRelations) => {
        // Determine next status
        const NEXT: Record<string, string> = {
          pending: "assigned",
          assigned: "delivered",
          delivered: "completed",
          completed: "completed",
        };
        const nextStatus = NEXT[o.status == null ? "" : o.status] || "pending";

        return (
          <div className="space-x-2">
            {/* Status transition */}
            {o.status !== "completed" && (
              <ActionButton
                label={`Mark ${nextStatus}`}
                onClick={() => updateStatus(o.id, nextStatus)}
                colorClass="bg-blue-600 text-white"
              />
            )}
            {/* View detail */}
            <ActionButton
              label="View"
              onClick={() => router.push(`/admin/orders/${o.id}`)}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <ToastContainer />
      <h1 className="text-2xl font-semibold">Orders & Deliveries</h1>

      {loading ? (
        <div className="text-gray-600">Loading orders…</div>
      ) : (
        <>
          <DataTable<OrderWithRelations> columns={columns} data={orders} />

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
