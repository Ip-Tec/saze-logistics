// app/admin/riders/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrderRow = Database["public"]["Tables"]["order"]["Row"];

export default function RiderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rider, setRider] = useState<ProfileRow | null>(null);
  const [deliveries, setDeliveries] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    async function fetchData() {
      // 1) fetch rider profile
      const { data: r, error: re } = await supabase
        .from("profiles")
        .select("id,name,email,phone,status,role")
        .eq("id", id)
        .single();

      if (re || !r) {
        setError(re?.message || "Rider not found");
        setLoading(false);
        return;
      }

      // 2) fetch delivered orders for this rider
      const { data: orders, error: oe } = await supabase
        .from("order")
        .select("id, created_at, total_amount, status")
        .eq("rider_id", id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(20);

      if (oe) {
        setError(oe.message);
      } else {
        setRider(r as any);
        setDeliveries(orders as OrderRow[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) return <div className="p-4">Loading rider…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!rider) return null;

  // Total earnings
  const totalEarnings = deliveries.reduce(
    (sum, d) => sum + (d.total_amount ?? 0),
    0
  );

  // Columns for recent deliveries
  const deliveryCols = [
    { header: "Order ID", accessor: (o: OrderRow) => o.id },
    {
      header: "Date",
      accessor: (o: OrderRow) => new Date(o.created_at!).toLocaleDateString(),
    },
    {
      header: "Amount (₦)",
      accessor: (o: OrderRow) => o.total_amount?.toFixed(2),
    },
    { header: "Status", accessor: (o: OrderRow) => o.status },
    {
      header: "Actions",
      accessor: (o: OrderRow) => (
        <ActionButton
          label="View"
          onClick={() => router.push(`/admin/orders/${o.id}`)}
        />
      ),
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline"
      >
        ← Back to Riders
      </button>

      {/* Rider Info */}
      <div className="bg-white shadow rounded p-6 space-y-2">
        <h1 className="text-2xl font-bold">{rider.name}</h1>
        <p>
          <strong>Email:</strong> {rider.email}
        </p>
        <p>
          <strong>Phone:</strong> {rider.phone || "—"}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            className={
              rider.status === "active"
                ? "text-green-600"
                : rider.status === "pending"
                  ? "text-yellow-600"
                  : "text-red-600"
            }
          >
            {rider.status}
          </span>
        </p>
        <p>
          <strong>Total Earnings:</strong> ₦{totalEarnings.toFixed(2)}
        </p>
      </div>

      {/* Recent Deliveries */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Recent Deliveries</h2>
        <DataTable<OrderRow> columns={deliveryCols} data={deliveries} />
      </div>
    </div>
  );
}
