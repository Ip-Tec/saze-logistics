// hooks/user/useRiderLocations.ts
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@shared/supabaseClient";
import { toast } from "react-toastify";
import { LatLng, Rider } from "@/app/(root)/user/page"; // Import types from main page

interface RawRider {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const useRiderLocations = (
  isLoaded: boolean,
  pickupCoords: LatLng | null | undefined,
  closeRiderThresholdKm: number
) => {
  const [fetchedRiders, setFetchedRiders] = useState<RawRider[]>([]);
  const [nearestRiderInfo, setNearestRiderInfo] = useState<{
    rider: Rider | null;
    distanceKm: number | null;
  }>({ rider: null, distanceKm: null });

  // Load initial riders
  useEffect(() => {
    async function fetchRidersData() {
      if (!isLoaded) return;
      const { data: ridersProfileData, error: ridersErr } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "rider")
        .eq("status", "active"); // Ensure we only fetch active riders

      if (ridersErr) {
        toast.error("Error fetching riders: " + ridersErr.message);
        return;
      }
      if (!ridersProfileData || ridersProfileData.length === 0) {
        setFetchedRiders([]);
        return;
      }

      const ids = ridersProfileData.map((r) => r.id);
      const { data: locsData, error: locErr } = await supabase
        .from("rider_location")
        .select("rider_id, latitude, longitude")
        .in("rider_id", ids)
        .order("recorded_at", { ascending: false });

      if (locErr) {
        toast.error("Error fetching rider locations: " + locErr.message);
        return;
      }

      const latestLocMap = new Map<string, { lat: number; lng: number }>();
      locsData?.forEach((l: any) => {
        if (
          l.rider_id &&
          !latestLocMap.has(l.rider_id) &&
          typeof l.latitude === "number" &&
          typeof l.longitude === "number"
        ) {
          latestLocMap.set(l.rider_id, { lat: l.latitude, lng: l.longitude });
        }
      });

      const initialRiders: RawRider[] = ridersProfileData.map((r) => ({
        id: r.id,
        name: r.name || "Unnamed Rider",
        lat: latestLocMap.get(r.id)?.lat || 0,
        lng: latestLocMap.get(r.id)?.lng || 0,
      }));
      setFetchedRiders(initialRiders);
    }
    if (isLoaded) fetchRidersData();
  }, [isLoaded]);

  // Real-time rider location updates
  useEffect(() => {
    if (!isLoaded) return;
    const channel = supabase
      .channel("rider_live_location_updates_v4") // Ensure unique channel name
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rider_location" },
        (payload: any) => {
          const { rider_id, latitude, longitude } = payload.new;
          if (
            rider_id &&
            typeof latitude === "number" &&
            typeof longitude === "number"
          ) {
            setFetchedRiders((prevRawRiders) => {
              const updated = prevRawRiders.map((r) =>
                r.id === rider_id ? { ...r, lat: latitude, lng: longitude } : r
              );
              // If the rider is new and not in the list, add them (though initial fetch covers existing active riders)
              if (!updated.some((r) => r.id === rider_id)) {
                // You might need to fetch rider's name for new riders if they aren't pre-fetched by profiles query
                // For now, assuming only locations for already known riders are updated
                return [
                  ...updated,
                  {
                    id: rider_id,
                    name: `Rider ${rider_id.substring(0, 4)}`,
                    lat: latitude,
                    lng: longitude,
                  },
                ];
              }
              return updated;
            });
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED")
          console.log("Subscribed to rider_location inserts_v4");
        else if (err || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Subscription error v4:", err || status);
          toast.error("Rider update issue.");
        }
      });
    return () => {
      supabase
        .removeChannel(channel)
        .catch((err) => console.error("Error removing channel", err));
    };
  }, [isLoaded]);

  // Memoize riders with calculated distances
  const riders = useMemo<Rider[]>(() => {
    if (
      !pickupCoords ||
      !fetchedRiders.length ||
      !isLoaded ||
      typeof window.google === "undefined" ||
      !window.google.maps ||
      !window.google.maps.geometry
    ) {
      return fetchedRiders.map((r) => ({
        ...r,
        distanceFromPickup: undefined,
      }));
    }
    const pickupLocation = new window.google.maps.LatLng(
      pickupCoords.lat,
      pickupCoords.lng
    );

    return fetchedRiders.map((rider) => {
      if (rider.lat === 0 && rider.lng === 0)
        return { ...rider, distanceFromPickup: undefined };
      const riderLocation = new window.google.maps.LatLng(rider.lat, rider.lng);
      const distanceMeters =
        window.google.maps.geometry.spherical.computeDistanceBetween(
          pickupLocation,
          riderLocation
        );
      const distanceKm = parseFloat((distanceMeters / 1000).toFixed(2));
      return { ...rider, distanceFromPickup: distanceKm };
    });
  }, [fetchedRiders, pickupCoords, isLoaded]);

  // Effect to compute nearestRiderInfo
  useEffect(() => {
    if (!riders.length || !pickupCoords) {
      setNearestRiderInfo({ rider: null, distanceKm: null });
      return;
    }

    let closestRider: Rider | null = null;
    let minDistanceKm = Infinity;

    riders.forEach((rider) => {
      if (
        rider.distanceFromPickup !== undefined &&
        rider.distanceFromPickup < minDistanceKm
      ) {
        minDistanceKm = rider.distanceFromPickup;
        closestRider = rider;
      }
    });

    if (closestRider) {
      setNearestRiderInfo({ rider: closestRider, distanceKm: minDistanceKm });
    } else {
      setNearestRiderInfo({ rider: null, distanceKm: null });
    }
  }, [riders, pickupCoords, closeRiderThresholdKm]);

  return { riders, nearestRiderInfo, setFetchedRiders, setNearestRiderInfo };
};
