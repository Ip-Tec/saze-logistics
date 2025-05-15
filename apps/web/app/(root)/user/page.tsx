"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@shared/supabaseClient";
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";
import { Truck } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

// Dynamically load react-leaflet components
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});

export default function UserHomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [riders, setRiders] = useState<
    Array<{ id: string; name: string; lat: number; lng: number }>
  >([]);
  const [loadingMap, setLoadingMap] = useState(true);

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [booking, setBooking] = useState(false);

  // 0) Fetch current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // 1) Get browser geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLoc([coords.latitude, coords.longitude]);
        setLoadingMap(false);
      },
      (err) => {
        console.error("Geolocation error", err);
        toast.error("Unable to get your location.");
        setLoadingMap(false);
      }
    );
  }, []);

  // 2) Load ACTIVE riders’ latest known locations
  useEffect(() => {
    if (!userLoc) return;
    supabase
      .from("delivery_address")
      .select("user_id, lat, lng, profiles(name)")
      .eq("profiles.role", "rider")
      .eq("profiles.status", "active")
      .then(({ data, error }) => {
        if (error) {
          console.error("Fetch riders error", error.message);
          return;
        }
        setRiders(
          (data || [])
            .filter((d) => d.lat != null && d.lng != null)
            .map((d) => ({
              id: d.user_id!,
              name: (d as any).profiles.name,
              lat: d.lat!,
              lng: d.lng!,
            }))
        );
      });
  }, [userLoc]);

  // 3) Book a ride
  const handleBook = async () => {
    if (!pickup || !destination) {
      return toast.error("Please enter both pickup and destination");
    }
    if (!userId) {
      return toast.error("Not authenticated");
    }

    setBooking(true);
    const { error } = await supabase.from("order").insert([
      {
        user_id: userId,
        special_instructions: `Pickup: ${pickup}; Destination: ${destination}`,
        payment_method: "cash",
        total_amount: 0,
        status: "pending",
      },
    ]);

    if (error) toast.error("Booking failed: " + error.message);
    else toast.success("Ride requested!");
    setBooking(false);
  };

  // 4) Call nearest rider
  const handleCall = async () => {
    if (!userLoc) {
      return toast.warn("Waiting on your location…");
    }
    if (!riders.length) {
      return toast.error("No riders nearby");
    }
    if (!userId) {
      return toast.error("Not authenticated");
    }

    // find nearest
    const [lat, lng] = userLoc;
    let nearest = riders[0];
    let minDist = Infinity;
    riders.forEach((r) => {
      const d = (r.lat - lat) ** 2 + (r.lng - lng) ** 2;
      if (d < minDist) {
        minDist = d;
        nearest = r;
      }
    });

    const { error } = await supabase.from("call").insert([
      {
        caller_id: userId,
        receiver_id: nearest.id,
        start_time: new Date().toISOString(),
        status: "initiated",
        type: "ride_request",
      },
    ]);

    if (error) toast.error("Call failed: " + error.message);
    else toast.success(`Calling rider ${nearest.name}…`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <ToastContainer />
      {/* Map (70% on desktop, full-width first on mobile) */}
      <div className="flex-[7] h-80 md:h-screen">
        {loadingMap || !userLoc ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading map…
          </div>
        ) : (
          <MapContainer center={userLoc} zoom={13} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={userLoc} />
            {riders.map((r) => (
              <Marker key={r.id} position={[r.lat, r.lng]} />
            ))}
          </MapContainer>
        )}
      </div>

      {/* Booking Form (30% on desktop, below map on mobile) */}
      <div className="flex-[3] w-full p-6 space-y-6 bg-white">
        <GlassDiv className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Book a Rider</h2>

          <div>
            <label className="block text-sm font-medium">Pickup</label>
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Where to pick you up?"
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where to go?"
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <GlassButton
            onClick={handleBook}
            disabled={booking}
            className="w-full text-white bg-green-600 hover:bg-green-700"
          >
            {booking ? "Requesting…" : "Request Ride"}
          </GlassButton>

          <GlassButton
            onClick={handleCall}
            className="w-full !text-black bg-blue-600 hover:bg-blue-700"
          >
            <Truck size={16} className="inline mr-2" />
            Call Nearest Rider
          </GlassButton>
        </GlassDiv>
      </div>
    </div>
  );
}
