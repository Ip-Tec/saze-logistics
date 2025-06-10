"use client";

import React, { useState, useEffect, useRef } from "react";
// ⬇️ STEP 1: Import Polyline directly from the library
import {
  GoogleMap,
  Marker,
  Polyline, // Import Polyline here
  useLoadScript,
} from "@react-google-maps/api";
import { toast } from "react-toastify";
import { LatLng } from "@/app/(root)/user/page";
import { supabase } from "@shared/supabaseClient";

const MAP_LIBS: Array<"places" | "geocoding" | "geometry"> = ["geometry"];
// ⬇️ STEP 2: Make sure this variable name is correct and matches your .env.local file
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!; 
const MAP_STYLE = { width: "100%", height: "400px", borderRadius: "8px" };
const DEFAULT_CENTER = { lat: 6.74, lng: 6.1381 }; // Ekpoma, Nigeria

interface OrderDetailsClientProps {
  riderId: string | null;
  initialRiderLat?: number | null;
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
    googleMapsApiKey: MAPS_API_KEY, // Use the corrected variable
    libraries: MAP_LIBS,
  });

  const [riderLocation, setRiderLocation] = useState<LatLng | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const mapCenter =
    riderLocation || pickupCoords || dropoffCoords || DEFAULT_CENTER;

  useEffect(() => {
    if (
      initialRiderLat != null && // Use != null to check for both null and undefined
      initialRiderLng != null
    ) {
      setRiderLocation({ lat: initialRiderLat, lng: initialRiderLng });
    }

    if (riderId) {
      const channel = supabase
        .channel(`rider_location_update_${riderId}`)
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
            if (latitude != null && longitude != null) {
              const newPos = { lat: latitude, lng: longitude };
              setRiderLocation(newPos);
              mapRef.current?.panTo(newPos); // Gently pan the map to the new location
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [riderId, initialRiderLat, initialRiderLng]);
  
  // Fit map to bounds effect
  useEffect(() => {
    if (isLoaded && mapRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        if (pickupCoords) bounds.extend(pickupCoords);
        if (dropoffCoords) bounds.extend(dropoffCoords);
        if (riderLocation) bounds.extend(riderLocation);

        if (!bounds.isEmpty()) {
            mapRef.current.fitBounds(bounds, 100); // 100px padding
        }
    }
  }, [isLoaded, pickupCoords, dropoffCoords, riderLocation]);


  if (loadError) return <div>Error loading map: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading Map…</div>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
        Live Order Map
      </h2>
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={mapCenter}
        zoom={12}
        onLoad={map => { mapRef.current = map; }}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* Markers for pickup, dropoff, and rider */}
        {pickupCoords && <Marker position={pickupCoords} title="Pickup" />}
        {dropoffCoords && <Marker position={dropoffCoords} title="Drop-off" />}
        {riderLocation && <Marker position={riderLocation} title="Rider" icon={{ url: "/icons/motorcycle.png", scaledSize: new window.google.maps.Size(40, 40) }} />}
        
        {/* ⬇️ STEP 3: Use the imported Polyline component directly */}
        {pickupCoords && dropoffCoords && (
          <Polyline
            path={[pickupCoords, dropoffCoords]}
            options={{
              strokeColor: "#FF0000",
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

// ⬇️ STEP 4: Remove the custom Polyline component from here

export default OrderDetailsClient;