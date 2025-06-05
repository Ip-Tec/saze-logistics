// app/(root)/user/orders/[orderId]/track/RiderTrackingMapClient.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
// Import Polyline from @react-google-maps/api if you want to use their component
// If you want to use your custom Polyline component, keep it as is, but fix the prop spreading.
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { toast } from "react-toastify";
import { supabase } from "@shared/supabaseClient";

// Define LatLng type if not correctly exported from your other file, or move to a shared types file.
// For demonstration, I'll define it here.
interface LatLng {
  lat: number;
  lng: number;
}

const MAP_LIBS: Array<"places" | "geocoding" | "geometry"> = ["geometry"];
const Maps_API_KEY = process.env.NEXT_PUBLIC_Maps_API_KEY!;
const MAP_STYLE = { width: "100%", height: "100vh" };
const DEFAULT_CENTER = { lat: 6.74, lng: 6.1381 }; // Ekpoma center

interface RiderTrackingMapClientProps {
  riderId: string;
  initialRiderName: string;
  pickupCoords: LatLng | null;
  dropoffCoords: LatLng | null;
}

const RiderTrackingMapClient: React.FC<RiderTrackingMapClientProps> = ({
  riderId,
  initialRiderName,
  pickupCoords,
  dropoffCoords,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: Maps_API_KEY,
    libraries: MAP_LIBS,
  });

  const [riderLocation, setRiderLocation] = useState<LatLng | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Set initial map center to pickup or dropoff, or default
  const mapCenter = pickupCoords || dropoffCoords || DEFAULT_CENTER;

  useEffect(() => {
    // Fetch initial rider location
    const fetchInitialRiderLocation = async () => {
      const { data, error } = await supabase
        .from("rider_location")
        .select("latitude, longitude")
        .eq("rider_id", riderId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching initial rider location:", error);
        toast.error("Could not get rider's initial location.");
        return;
      }
      if (data && data.latitude !== null && data.longitude !== null) {
        setRiderLocation({ lat: data.latitude, lng: data.longitude });
        // Only pan if the map is loaded
        if (mapRef.current) {
          mapRef.current.panTo({ lat: data.latitude, lng: data.longitude });
        }
      }
    };

    // Only fetch and subscribe if Google Maps script is loaded to ensure `window.google` is available for `LatLng` creation
    if (isLoaded) {
      fetchInitialRiderLocation();

      // Subscribe to real-time rider location updates
      const channel = supabase
        .channel(`rider_location_updates_${riderId}`) // Unique channel for each rider
        .on(
          "postgres_changes",
          {
            event: "INSERT", // Listen for new location inserts
            schema: "public",
            table: "rider_location",
            filter: `rider_id=eq.${riderId}`, // Filter for this specific rider
          },
          (payload: any) => {
            const { latitude, longitude } = payload.new;
            if (latitude !== null && longitude !== null) {
              const newLocation = { lat: latitude, lng: longitude };
              setRiderLocation(newLocation);
              if (mapRef.current) {
                mapRef.current.panTo(newLocation); // Pan map to rider's new location
              }
            }
          }
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            console.log(`Subscribed to rider ${riderId} live location.`);
          } else if (err) {
            console.error(`Subscription error for rider ${riderId}:`, err);
            toast.error("Failed to track rider in real-time.");
          }
        });

      return () => {
        supabase
          .removeChannel(channel)
          .catch((err) => console.error("Error removing channel:", err));
      };
    }
  }, [riderId, isLoaded]);

  if (loadError)
    return (
      <div className="flex items-center justify-center h-full p-4 text-red-600 bg-red-50 text-center">
        Error loading Google Maps for tracking: {loadError.message}.
      </div>
    );
  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl animate-pulse">Loading Tracking Map…</p>
      </div>
    );

  return (
    <GoogleMap
      mapContainerStyle={MAP_STYLE}
      center={riderLocation || mapCenter} // Prioritize rider location, then map center
      zoom={riderLocation ? 15 : 13} // Zoom in more if rider location is known
      onLoad={(map) => {
        mapRef.current = map;
      }}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {pickupCoords && (
        <Marker
          position={pickupCoords}
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new window.google.maps.Size(40, 40),
          }}
          title="Pickup Location"
          label={{
            text: "Pickup",
            className: "text-xs font-semibold text-gray-800",
            color: "#333",
          }}
        />
      )}
      {dropoffCoords && (
        <Marker
          position={dropoffCoords}
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new window.google.maps.Size(40, 40),
          }}
          title="Drop-off Location"
          label={{
            text: "Drop-off",
            className: "text-xs font-semibold text-gray-800",
            color: "#333",
          }}
        />
      )}
      {riderLocation && (
        <Marker
          position={riderLocation}
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new window.google.maps.Size(40, 40),
          }}
          title={`${initialRiderName} (Rider)`}
          label={{
            text: initialRiderName,
            fontWeight: "bold",
            color: "white",
            className: "bg-blue-600 px-2 py-1 rounded-md text-xs",
          }}
        />
      )}
      {/* Optionally draw a polyline between pickup, rider, and dropoff */}
      {pickupCoords && riderLocation && dropoffCoords && isLoaded && (
        <Polyline
          path={[
            new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng),
            new window.google.maps.LatLng(riderLocation.lat, riderLocation.lng),
            new window.google.maps.LatLng(dropoffCoords.lat, dropoffCoords.lng),
          ]}
          strokeColor="#FF0000"
          strokeOpacity={0.8}
          strokeWeight={2}
          icons={[
            {
              icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
              offset: "100%",
            },
          ]}
        />
      )}
    </GoogleMap>
  );
};

// Simple Polyline component for Google Maps API
// The props passed to this component directly correspond to google.maps.PolylineOptions
const Polyline: React.FC<google.maps.PolylineOptions> = (props) => {
  // Changed 'options' to 'props' for clarity
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    // Ensure google is defined before creating Polyline
    if (!window.google) {
      console.warn("Google Maps API not loaded, cannot create Polyline.");
      return;
    }

    if (!polylineRef.current) {
      polylineRef.current = new window.google.maps.Polyline(props);
    }
    polylineRef.current.setOptions(props);

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [props]);

  return null;
};

export default RiderTrackingMapClient;
