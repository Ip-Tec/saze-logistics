// app/(root)/user/UserHomePage.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  Autocomplete,
  OverlayView,
} from "@react-google-maps/api";
import { supabase } from "@shared/supabaseClient";
import GlassButton from "@/components/ui/GlassButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Libraries } from "@react-google-maps/api";

// --- Constants & types ---
const MAP_LIBS: Libraries = ["places"];
const MAP_STYLE = { width: "100%", height: "100%" };

type LatLng = google.maps.LatLngLiteral;

interface Rider {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Package {
  pickup: { text: string; coords: LatLng } | null;
  dropoff: { text: string; coords: LatLng } | null;
  quantity: number;
  description: string;
}
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
export default function UserHomePage() {
  // --- Auth & Map load ---
  const [userId, setUserId] = useState<string | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBS,
  });

  // --- Core state ---
  const [userLoc, setUserLoc] = useState<LatLng>();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [nearest, setNearest] = useState<Rider | null>(null);
  const [packages, setPackages] = useState<Package[]>([
    { pickup: null, dropoff: null, quantity: 1, description: "" },
  ]);
  const [showSummary, setShowSummary] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // --- Autocomplete refs per package entry ---
  const pickupRefs = useRef<Array<google.maps.places.Autocomplete | null>>([]);
  const dropoffRefs = useRef<Array<google.maps.places.Autocomplete | null>>([]);

  // --- Get user & geolocation ---
  useEffect(() => {
    supabase.auth.getUser().then((r) => {
      if (r.data.user) setUserId(r.data.user.id);
    });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setUserLoc({ lat: coords.latitude, lng: coords.longitude }),
      () => toast.error("Unable to get location"),
      { enableHighAccuracy: true }
    );
  }, []);

  // --- Load riders once we have userLoc ---
  useEffect(() => {
    // 1) fetch all active riders
    supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "rider")
      .eq("status", "active")
      .then(async ({ data: ridersData, error: ridersErr }) => {
        if (ridersErr) return toast.error(ridersErr.message);
        const ids = ridersData!.map((r) => r.id);
        // 2) fetch latest location per rider_id
        const { data: locs, error: locErr } = await supabase
          .from("rider_location")
          .select("rider_id: rider_id, latitude, longitude")
          .in("rider_id", ids)
          .order("recorded_at", { ascending: false });
        if (locErr) return toast.error(locErr.message);
        // reduce to one entry per rider_id
        const latestMap = new Map<string, { lat: number; lng: number }>();
        locs!.forEach((l: any) => {
          if (!latestMap.has(l.rider_id)) {
            latestMap.set(l.rider_id, { lat: l.latitude, lng: l.longitude });
          }
        });
        const list: Rider[] = ridersData!.map((r) => ({
          id: r.id,
          name: r.name,
          lat: latestMap.get(r.id)?.lat || 0,
          lng: latestMap.get(r.id)?.lng || 0,
        }));
        setRiders(list);
      });
  }, []); // only once on mount

  //subscribe to real-time inserts on rider_location
  useEffect(() => {
    const channel = supabase
      .channel("rider_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rider_location" },
        (payload) => {
          const { rider_id, latitude, longitude } = payload.new as any;
          setRiders((rs) =>
            rs.map((r) =>
              r.id === rider_id ? { ...r, lat: latitude, lng: longitude } : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Compute nearest rider whenever riders or userLoc change ---
  useEffect(() => {
    if (!userLoc || !riders.length) return;
    let best: Rider = riders[0];
    let minDist = Infinity;
    riders.forEach((r) => {
      const d = (r.lat - userLoc.lat) ** 2 + (r.lng - userLoc.lng) ** 2;
      if (d < minDist) {
        minDist = d;
        best = r;
      }
    });
    setNearest(best);
  }, [riders, userLoc]);

  // --- Map load callback ---
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // --- Autocomplete handlers for each package entry ---
  function onLoadAutocomplete(
    refList: React.MutableRefObject<any[]>,
    idx: number,
    ac: google.maps.places.Autocomplete
  ) {
    refList.current[idx] = ac;
  }
  function onPlaceChanged(
    refList: React.MutableRefObject<any[]>,
    idx: number,
    setter: (fn: (old: Package[]) => Package[]) => void,
    field: "pickup" | "dropoff"
  ) {
    const ac = refList.current[idx];
    if (!ac) return;
    const place = ac.getPlace();
    if (!place.geometry?.location) return;
    const coords = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    setter((pkgs) => {
      const copy = [...pkgs];
      copy[idx] = {
        ...copy[idx],
        [field]: { text: place.formatted_address || place.name || "", coords },
      };
      return copy;
    });
  }

  // --- Manage package entries ---
  const addPackage = () =>
    setPackages((pkgs) => [
      ...pkgs,
      { pickup: null, dropoff: null, quantity: 1, description: "" },
    ]);
  const removePackage = (i: number) =>
    setPackages((pkgs) => pkgs.filter((_, j) => j !== i));

  // --- Confirm & submit booking ---
  const confirmBooking = async () => {
    if (!userId) return toast.error("Not signed in");
    // simple validation:
    for (let pkg of packages) {
      if (!pkg.pickup || !pkg.dropoff)
        return toast.error("All pick-up & drop-off required");
    }
    // Here you could iterate packages, assign same or new rider, etc.
    // For brevity, we just log the booking:
    console.log("BOOKING", { userId, nearest, packages });
    setShowSummary(false);
    toast.success("Booking confirmed!");
  };

  // --- Render ---
  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading map…</div>;
  if (!userLoc) return <div>Waiting for location…</div>;

  return (
    <div className="relative flex flex-col md:flex-row h-screen w-full">
      <ToastContainer />

      {/* --- Map --- */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={MAP_STYLE}
          center={userLoc}
          zoom={13}
          onLoad={onMapLoad}
        >
          <Marker position={userLoc} label="You" />
          {riders.map((r) => (
            <Marker key={r.id} position={{ lat: r.lat, lng: r.lng }} />
          ))}
          {nearest && (
            <OverlayView
              position={{ lat: nearest.lat, lng: nearest.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="bg-yellow-300 p-1 rounded shadow">
                Closest: {nearest.name}
              </div>
            </OverlayView>
          )}
        </GoogleMap>
      </div>

      {/* --- Controls --- */}
      <div className="md:w-1/3 bg-white p-4 overflow-auto">
        <h2 className="text-xl font-semibold mb-2">Your Packages</h2>
        {packages.map((pkg, i) => (
          <div key={i} className="border rounded p-3 mb-3 space-y-2">
            <div className="flex justify-between">
              <strong>Package #{i + 1}</strong>
              {packages.length > 1 && (
                <button
                  onClick={() => removePackage(i)}
                  className="text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
            <Autocomplete
              onLoad={(ac) => onLoadAutocomplete(pickupRefs, i, ac)}
              onPlaceChanged={() =>
                onPlaceChanged(pickupRefs, i, setPackages, "pickup")
              }
            >
              <input
                className="w-full border px-2 py-1 rounded mb-1"
                placeholder={pkg.pickup?.text || "Pickup address"}
              />
            </Autocomplete>
            <Autocomplete
              onLoad={(ac) => onLoadAutocomplete(dropoffRefs, i, ac)}
              onPlaceChanged={() =>
                onPlaceChanged(dropoffRefs, i, setPackages, "dropoff")
              }
            >
              <input
                className="w-full border px-2 py-1 rounded mb-1"
                placeholder={pkg.dropoff?.text || "Drop-off address"}
              />
            </Autocomplete>
            <input
              type="number"
              min={1}
              value={pkg.quantity}
              onChange={(e) => {
                const q = parseInt(e.target.value) || 1;
                setPackages((pkgs) => {
                  const c = [...pkgs];
                  c[i].quantity = q;
                  return c;
                });
              }}
              className="w-1/3 border px-2 py-1 rounded"
              placeholder="Qty"
            />
            <input
              value={pkg.description}
              onChange={(e) => {
                const v = e.target.value;
                setPackages((pkgs) => {
                  const c = [...pkgs];
                  c[i].description = v;
                  return c;
                });
              }}
              className="w-full border px-2 py-1 rounded"
              placeholder="Description"
            />
          </div>
        ))}

        <button
          onClick={addPackage}
          className="mb-4 px-4 py-2 bg-gray-200 rounded"
        >
          + Add another package
        </button>

        <GlassButton
          onClick={() => setShowSummary(true)}
          className="w-full !bg-green-600 hover:!bg-green-700 !p-4 text-white hover:!text-gray-100 rounded"
        >
          Review & Confirm
        </GlassButton>
      </div>

      {/* --- Bottom‐sheet summary --- */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/40 flex items-end">
          <div className="bg-white w-full md:w-1/3 max-h-3/4 overflow-auto rounded-t-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Confirm Booking</h3>
            <p>
              <strong>Rider:</strong> {nearest?.name}
            </p>
            <div className="mt-2 space-y-2">
              {packages.map((pkg, i) => (
                <div key={i} className="border p-2 rounded">
                  <p>
                    <strong>Pickup:</strong> {pkg.pickup?.text}
                  </p>
                  <p>
                    <strong>Drop-off:</strong> {pkg.dropoff?.text}
                  </p>
                  <p>
                    <strong>Qty:</strong> {pkg.quantity}
                  </p>
                  <p>
                    <strong>Info:</strong> {pkg.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSummary(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
