"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import ContentForm from "@/components/admin/content/ContentForm";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";
import { toast, ToastContainer } from "react-toastify";

type ContentRow = Database["public"]["Tables"]["content"]["Row"];

export default function ContentPage() {
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ContentRow | null>(null);

  // Fetch all content entries
  const fetchContent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading content:", error.message);
    } else {
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  // Delete an entry
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    const { error } = await supabase.from("content").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      fetchContent();
    }
  };

  const columns = [
    { header: "Title", accessor: (c: ContentRow) => c.title },
    { header: "Type", accessor: (c: ContentRow) => c.type },
    {
      header: "Image",
      accessor: (c: ContentRow) =>
        c.image_url ? (
          <img src={c.image_url} alt="" className="h-12 object-cover rounded" />
        ) : (
          "—"
        ),
    },
    {
      header: "Created",
      accessor: (c: ContentRow) => new Date(c.created_at!).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: (c: ContentRow) => (
        <div className="space-x-2">
          <ActionButton
            label="Edit"
            onClick={() => {
              setEditItem(c);
              setShowForm(true);
            }}
          />
          <ActionButton
            label="Delete"
            onClick={() => handleDelete(c.id)}
            colorClass="bg-red-600 text-white"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <ToastContainer />
      <h1 className="text-2xl font-semibold">Content Management</h1>

      <ActionButton
        label="New Content"
        onClick={() => {
          setEditItem(null);
          setShowForm(true);
        }}
        colorClass="bg-blue-600 text-white"
      />

      {loading ? (
        <div className="text-gray-600">Loading content…</div>
      ) : (
        <DataTable<ContentRow> columns={columns} data={items} />
      )}

      {showForm && (
        <ContentForm
          initialData={editItem}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchContent();
          }}
        />
      )}
    </div>
  );
}
