// app/(root)/user/orders/[orderId]/OrderDetailsClient.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { toast } from "react-toastify";
import { LatLng } from "@/app/(root)/user/page"; // Re-use LatLng type
import { supabase } from "@shared/supabaseClient";

const MAP_LIBS: Array<"places" | "geocoding" | "geometry"> = ["geometry"];
const Maps_API_KEY = process.env.NEXT_PUBLIC_Maps_API_KEY!;
const MAP_STYLE = { width: "100%", height: "400px", borderRadius: "8px" }; // Adjusted height for embedding
const DEFAULT_CENTER = { lat: 6.74, lng: 6.1381 }; // Ekpoma center

interface OrderDetailsClientProps {
  riderId: string | null; // Rider ID can be null if unassigned
  initialRiderLat?: number | null; // Initial rider location if available
  initialRiderLng?: number | null;
  dropoffCoords: LatLng | null;
  pickupCoords: LatLng | null;
}

const OrderDetailsClient: React.FC<OrderDetailsClientProps> = ({
  riderId,
  initialRiderLat,
  initialRiderLng,
  dropoffCoords,
  pickupCoords,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: Maps_API_KEY,
    libraries: MAP_LIBS,
  });

  const [riderLocation, setRiderLocation] = useState<LatLng | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Determine initial map center: prioritize rider, then pickup, then dropoff, then default
  const mapCenter =
    riderLocation || pickupCoords || dropoffCoords || DEFAULT_CENTER;

  useEffect(() => {
    // Set initial rider location if provided from server props
    if (
      initialRiderLat !== null &&
      initialRiderLng !== null &&
      initialRiderLat !== undefined &&
      initialRiderLng !== undefined
    ) {
      setRiderLocation({ lat: initialRiderLat, lng: initialRiderLng });
    }

    // Subscribe to real-time rider location updates ONLY IF riderId is present
    // and the order is active. For this `OrderDetailsClient`, we'll keep it simple
    // and only fetch initial if riderId is there. Real-time subscription is mainly for the dedicated /track page.
    // However, if you want real-time here too, you'd add the same supabase.channel logic as in RiderTrackingMapClient.
    if (riderId) {
      // Here, you could technically add the real-time subscription for rider_location,
      // but for a summary map, often a snapshot is enough.
      // If you want real-time, uncomment and adapt the code from RiderTrackingMapClient

      const channel = supabase
        .channel(`rider_location_snapshot_${riderId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "rider_location",
            filter: `rider_id=eq.${riderId}`,
          },
          (payload: any) => {
            const { latitude, longitude } = payload.new;
            if (latitude !== null && longitude !== null) {
              setRiderLocation({ lat: latitude, lng: longitude });
              if (mapRef.current) {
                // Optionally pan if rider moves significantly
                // mapRef.current.panTo({ lat: latitude, lng: longitude });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [riderId, initialRiderLat, initialRiderLng, isLoaded]);

  if (loadError)
    return (
      <div className="flex items-center justify-center h-96 p-4 text-red-600 bg-red-50 rounded-lg text-center shadow-md">
        Error loading Google Maps: {loadError.message}.
      </div>
    );
  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-96 rounded-lg bg-gray-100 shadow-md">
        <p className="text-xl animate-pulse text-gray-600">Loading Map…</p>
      </div>
    );

  // Calculate bounds to fit all markers if available
  const bounds = new window.google.maps.LatLngBounds();
  if (pickupCoords) bounds.extend(pickupCoords);
  if (dropoffCoords) bounds.extend(dropoffCoords);
  if (riderLocation) bounds.extend(riderLocation);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
        Order Map Overview
      </h2>
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={mapCenter}
        zoom={13} // Default zoom, will be overridden if bounds are set
        onLoad={(map) => {
          mapRef.current = map;
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
            // Optionally add padding if markers are too close to edge
            map.panBy(0, -50); // Adjust map slightly up if needed
          }
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
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // A general blue dot for rider on this overview map
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            title="Rider's Current Location"
            label={{
              text: "Rider",
              fontWeight: "bold",
              color: "white",
              className: "bg-blue-600 px-2 py-1 rounded-md text-xs",
            }}
          />
        )}
        {/* Optional: Polyline between pickup and dropoff */}
        {pickupCoords && dropoffCoords && isLoaded && (
          <Polyline
            path={[
              new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng),
              new window.google.maps.LatLng(
                dropoffCoords.lat,
                dropoffCoords.lng
              ),
            ]}
            strokeColor="#0000FF"
            strokeOpacity={0.6}
            strokeWeight={3}
          />
        )}
      </GoogleMap>
    </div>
  );
};

// Re-usable Polyline component for Google Maps API
const Polyline: React.FC<google.maps.PolylineOptions> = (options) => {
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline(options);
    }
    polylineRef.current.setOptions(options);
    polylineRef.current.setMap(options.map); // Ensure it's attached to the map

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null); // Remove polyline from map on unmount
        polylineRef.current = null;
      }
    };
  }, [options]);

  return null;
};

export default OrderDetailsClient;
