// components/vendor/BookRiderForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Rider {
  id: string;
  name: string;
  phone: string;
}

interface BookRiderFormProps {
  vendorId: string;
  onSuccess?: () => void;
}

export default function BookRiderForm({
  vendorId,
  onSuccess,
}: BookRiderFormProps) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 1) load rider list
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, name, phone, second_phone, licensePlate, rider_image_url, vehicle_image_url, vehicleType"
        )
        .eq("role", "rider");
      if (error) {
        toast.error(error.message);
        console.error("Error loading riders:", error);
      } else {
        setRiders(data || []);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!selectedRider || !pickupTime) {
      setErrorMsg("Please choose a rider and pickup time.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("order").insert({
      vendor_id: vendorId,
      rider_id: selectedRider,
      scheduled_pickup: pickupTime,
      status: "assigned",
    });

    setLoading(false);
    if (error) {
      console.error("Booking rider failed:", error);
      setErrorMsg(error.message);
    } else {
      onSuccess?.();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-lg shadow"
    >
      <h2 className="text-xl font-semibold">Book a Rider</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Select Rider
        </label>
        {riders.length === 0 ? (
          <p className="text-gray-500 text-sm">Loading riders…</p>
        ) : (
          <select
            value={selectedRider}
            onChange={(e) => setSelectedRider(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            disabled={loading}
          >
            <option value="">— choose one —</option>
            {riders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.phone})
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Pickup Time
        </label>
        <input
          type="datetime-local"
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          className="mt-1 block w-full border rounded p-2"
          disabled={loading}
        />
      </div>

      {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

      <button
        type="submit"
        className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
        Book Rider
      </button>
    </form>
  );
}
