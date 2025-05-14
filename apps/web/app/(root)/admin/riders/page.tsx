"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrderRow = Database["public"]["Tables"]["order"]["Row"];

interface Rider extends ProfileRow {
  earnings: number;
}

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  // Fetch riders + earnings
  const fetchRiders = async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 1) Get paginated riders + total count
    const [{ data: profiles, error: pe, count }] = await Promise.all([
      await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "rider")
        .order("name", { ascending: true })
        .range(from, to),
    ]);

    if (pe) {
      console.error("Error loading riders:", pe.message);
      setLoading(false);
      return;
    }
    setTotalCount(count ?? 0);

    // 2) For each rider, fetch sum of delivered orders
    const ridersWithEarnings: Rider[] = await Promise.all(
      (profiles ?? []).map(async (r) => {
        const { data: orders } = await supabase
          .from("order")
          .select("total_amount")
          .eq("rider_id", r.id)
          .eq("status", "delivered");

        const earnings =
          orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) ?? 0;
        return { ...r, earnings } as Rider;
      })
    );

    setRiders(ridersWithEarnings);
    setLoading(false);
  };
  useEffect(() => {
    fetchRiders();
  }, [page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Update rider status
  const updateStatus = async (
    id: string,
    nextStatus: "approved" | "rejected"
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update rider status: " + error.message);
    } else {
      fetchRiders();
    }
  };

  const columns = [
    { header: "Rider Name", accessor: (r: Rider) => r.name },
    {
      header: "Status",
      accessor: (r: Rider) => (
        <span
          className={
            r.status === "approved"
              ? "text-green-600"
              : r.status === "pending"
                ? "text-yellow-600"
                : "text-red-600"
          }
        >
          {r.status}
        </span>
      ),
    },
    { header: "Earnings (₦)", accessor: (r: Rider) => r.earnings.toFixed(2) },
    {
      header: "Actions",
      accessor: (r: Rider) => (
        <div className="space-x-2">
          {r.status === "pending" && (
            <>
              <ActionButton
                label="Verify"
                onClick={() => updateStatus(r.id, "approved")}
                colorClass="bg-green-600 text-white"
              />
              <ActionButton
                label="Reject"
                onClick={() => updateStatus(r.id, "rejected")}
                colorClass="bg-red-600 text-white"
              />
            </>
          )}
          <ActionButton
            label="View Profile"
            onClick={() => router.push(`/admin/riders/${r.id}`)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <ToastContainer />
      <h1 className="text-2xl font-semibold">Rider Management</h1>

      {loading ? (
        <div className="text-gray-600">Loading riders…</div>
      ) : (
        <>
          <DataTable<Rider> columns={columns} data={riders} />

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
