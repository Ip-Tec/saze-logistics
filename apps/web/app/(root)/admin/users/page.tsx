"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import ResetPasswordButton from "@/components/admin/people/ResetPasswordButton";
import { supabase } from "@shared/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { Database } from "@shared/supabase/types";
import { toast, ToastContainer } from "react-toastify";
import CreateUserForm from "@/components/admin/user/CreateUserForm";

type Profiles = Database["public"]["Tables"]["profiles"]["Row"];

interface User extends Profiles {
  status: "active" | "suspended";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false); // New state for modal

  const { user: currentUser, signOut, isCheckingAuth } = useAuthContext();

  const fetchUsers = async () => {
    setLoading(true);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [{ data, error }, countRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("name", { ascending: true })
        .range(from, to),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

    if (error) {
      console.error("Error loading users:", error.message);
      toast.error("Failed to load users.");
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setUsers(data as User[]);
    setTotalCount(countRes.count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleStatus = async (
    id: string,
    currentStatus: "active" | "suspended"
  ) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";

    const { data, error } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update user status.");
      return;
    }

    fetchUsers();
  };

  const columns = [
    { header: "Name", accessor: (u: User) => u.name },
    { header: "Email", accessor: (u: User) => u.email },
    { header: "Role", accessor: (u: User) => u.role },
    {
      header: "Status",
      accessor: (u: User) => (
        <span
          className={u.status === "active" ? "text-green-600" : "text-red-600"}
        >
          {u.status}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (u: User) => (
        <div className="space-x-2">
          <ResetPasswordButton email={u.email} />
          {currentUser?.role === "admin" && (
            <ActionButton
              label={u.status === "active" ? "Suspend" : "Activate"}
              onClick={() => toggleStatus(u.id, u.status)}
              colorClass={
                u.status === "active"
                  ? "bg-red-600 text-white"
                  : "bg-green-600 text-white"
              }
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4 w-fit">
      <ToastContainer />
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">User Management</h1>
        {/* Admin Create User Button */}
        {currentUser?.role === "admin" && (
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create User
            </button>
          </div>
        )}
      </header>
      {loading ? (
        <div className="text-gray-600">Loading users…</div>
      ) : (
        <>
          <DataTable<User> columns={columns} data={users} />
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

      {/* Modal for Create User Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 !bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New User</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <CreateUserForm
              onSuccess={() => {
                setIsModalOpen(false);
                fetchUsers();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
