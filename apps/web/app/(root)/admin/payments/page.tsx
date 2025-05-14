// app/admin/payments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";
import { toast, ToastContainer } from "react-toastify";

type OrderRow = Database["public"]["Tables"]["order"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface PaymentRecord extends OrderRow {
  user: ProfileRow;
}

export default function PaymentsPage() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();
  
  // Fetch paginated payments
  const fetchPayments = async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("order")
      .select(
        `
        id,
        user:profiles!order_user_id_fkey (id, name, email),
        total_amount,
        payment_method,
        payment_status,
        created_at
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error loading payments:", error.message);
      setLoading(false);
      return;
    }

    setRecords(data as any);
    setTotalCount(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Update payment status: e.g. pending→paid or paid→refunded
  const updatePaymentStatus = async (id: string, nextStatus: string) => {
    const { error } = await supabase
      .from("order")
      .update({ payment_status: nextStatus })
      .eq("id", id);

    if (error) {
      toast("Failed to update payment status: " + error.message);
    } else {
      fetchPayments();
    }
  };

  const columns = [
    { header: "Order ID", accessor: (r: PaymentRecord) => r.id },
    { header: "Customer", accessor: (r: PaymentRecord) => r.user.name },
    { header: "Email", accessor: (r: PaymentRecord) => r.user.email },
    {
      header: "Amount (₦)",
      accessor: (r: PaymentRecord) => r.total_amount.toFixed(2),
    },
    { header: "Method", accessor: (r: PaymentRecord) => r.payment_method },
    {
      header: "Status",
      accessor: (r: PaymentRecord) => {
        const color =
          r.payment_status === "paid"
            ? "text-green-600"
            : r.payment_status === "pending"
              ? "text-yellow-600"
              : r.payment_status === "failed"
                ? "text-red-600"
                : "text-gray-600";
        return <span className={color}>{r.payment_status}</span>;
      },
    },
    {
      header: "Actions",
      accessor: (r: PaymentRecord) => {
        let next = r.payment_status === "pending"
          ? "paid"
          : r.payment_status === "paid"
            ? "refunded"
            : r.payment_status;

        return (
          <div className="space-x-2">
            {/* Only allow meaningful transitions */}
            {r.payment_status !== "refunded" &&
              r.payment_status !== "failed" && (
                <ActionButton
                  label={next === "paid" ? "Mark Paid" : "Refund"}
                  onClick={() => next && updatePaymentStatus(r.id, next)} colorClass={
                    next === "paid"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }
                />
              )}
            <ActionButton
              label="View Order"
              onClick={() => router.push(`/admin/orders/${r.id}`)}
            />
          </div>
        );
      },    },
  ];

  return (
    <div className="p-4 space-y-4">
        <ToastContainer />
      <h1 className="text-2xl font-semibold">Payments & Transactions</h1>

      {loading ? (
        <div className="text-gray-600">Loading payments…</div>
      ) : (
        <>
          <DataTable<PaymentRecord> columns={columns} data={records} />

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
