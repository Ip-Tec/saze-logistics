// app/(root)/admin/vendors/page.tsx

"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";
import { toast, ToastContainer } from "react-toastify";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface Vendor extends ProfileRow {
  // status comes from profiles.status
  status: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  const fetchVendors = async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch paginated vendor profiles + total count
    const [{ data, error, count }] = await await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "vendor")
        .order("name", { ascending: true })
        .range(from, to),
    ]);
    if (error) {
      console.error("Error loading vendors:", error.message);
      setLoading(false);
      return;
    }

    setVendors(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, [page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const updateStatus = async (id: string, nextStatus: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update vendor status: " + error.message);
    } else {
      fetchVendors(); // refresh table
    }
  };

  const columns = [
    {
      header: "Vendor Name",
      accessor: (v: Vendor) => v.name,
    },
    {
      header: "Status",
      accessor: (v: Vendor) => (
        <span
          className={
            v.status === "approved"
              ? "text-green-600"
              : v.status === "pending"
                ? "text-yellow-600"
                : "text-red-600"
          }
        >
          {v.status}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (v: Vendor) => (
        <div className="space-x-2">
          {v.status === "pending" && (
            <>
              <ActionButton
                label="Approve"
                onClick={() => updateStatus(v.id, "approved")}
                colorClass="bg-green-600 text-white"
              />
              <ActionButton
                label="Reject"
                onClick={() => updateStatus(v.id, "rejected")}
                colorClass="bg-red-600 text-white"
              />
            </>
          )}
          <ActionButton
            label="View Catalog"
            onClick={() => {
              // Navigate to a vendor-specific catalog page
              //   window.location.href = `/vendors/${v.id}`;
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <ToastContainer />
      <h1 className="text-2xl font-semibold">Vendor Management</h1>

      {loading ? (
        <div className="text-gray-600">Loading vendors…</div>
      ) : (
        <>
          <DataTable<Vendor> columns={columns} data={vendors} />

          {/* Pagination Controls */}
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
