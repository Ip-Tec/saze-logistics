"use client";

import { useState } from "react";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";
import ActionButton from "@/components/admin/people/ActionButton";
import { toast } from "react-toastify";

type ContentRow = Database["public"]["Tables"]["content"]["Row"];

interface ContentFormProps {
  initialData: ContentRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ContentForm({
  initialData,
  onClose,
  onSaved,
}: ContentFormProps) {
  const isEdit = !!initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [type, setType] = useState(initialData?.type || "banner");
  const [body, setBody] = useState(initialData?.body || "");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    const payload = { title, type, body, image_url: imageUrl };

    let error = null;
    if (isEdit) {
      const res = await supabase
        .from("content")
        .update(payload)
        .eq("id", initialData!.id);
      error = res.error;
    } else {
      const res = await supabase.from("content").insert(payload);
      error = res.error;
    }

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      onSaved();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md space-y-4 p-6">
        <h2 className="text-xl font-semibold">
          {isEdit ? "Edit" : "New"} Content
        </h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Title</label>
          <input
            className="w-full border px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="block text-sm font-medium">Type</label>
          <select
            className="w-full border px-2 py-1"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="banner">Banner</option>
            <option value="static">Static Page</option>
            <option value="promotion">Promotion</option>
          </select>

          <label className="block text-sm font-medium">Body</label>
          <textarea
            className="w-full border px-2 py-1"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <label className="block text-sm font-medium">Image URL</label>
          <input
            className="w-full border px-2 py-1"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <ActionButton
            label="Cancel"
            onClick={onClose}
            colorClass="bg-gray-200 text-gray-800"
          />
          <ActionButton
            label={saving ? "Saving…" : "Save"}
            onClick={handleSubmit}
            colorClass="bg-blue-600 text-white"
          />
        </div>
      </div>
    </div>
  );
}
