// components/rider/RiderMap.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  DirectionsRenderer,
  DirectionsService,
} from "@react-google-maps/api";
import { toast } from "react-toastify";
import { LatLng } from "@/app/(root)/user/page"; 

const MAP_LIBS: Array<"places" | "geocoding" | "geometry"> = [
  "places",
  "geocoding",
  "geometry",
];
const EKPOMA_CENTER = { lat: 6.74, lng: 6.1381 }; // Fallback center for map center

interface RiderMapProps {
  pickupCoords: LatLng | null;
  dropoffCoords: LatLng | null;
  riderLocation: LatLng | null; // New prop for rider's current location
  showRouteFromRider: boolean; // New prop to control route origin: true = rider's location, false = pickup location
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

export default function RiderMap({ pickupCoords, dropoffCoords, riderLocation, showRouteFromRider }: RiderMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBS,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(EKPOMA_CENTER); // Initial map center

  // Initialize map instance and DirectionsService once loaded
  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
    if (typeof window.google !== "undefined" && window.google.maps.DirectionsService) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }
  }, []);

  // Clean up map instance on unmount
  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
    setDirections(null);
  }, []);

  // Effect to calculate and display the route
  useEffect(() => {
    // Only attempt to get directions if Google Maps API is loaded, DirectionsService is ready,
    // and we have a valid dropoff location.
    if (
      isLoaded &&
      directionsServiceRef.current &&
      dropoffCoords 
    ) {
      let origin: google.maps.LatLngLiteral | null = null;
      let destination: google.maps.LatLngLiteral = dropoffCoords;

      // Determine the origin of the route based on `showRouteFromRider` prop
      if (showRouteFromRider && riderLocation) {
        origin = riderLocation;
      } else if (pickupCoords) {
        origin = pickupCoords;
      }

      // If no valid origin or destination is available, clear directions and toast
      if (!origin || !destination) {
        setDirections(null);
        toast.warn("Insufficient location data to display route. Ensure pickup/dropoff or your live location are available.");
        // Center map on available coordinate if route cannot be drawn
        if (origin) setMapCenter(origin);
        else if (destination) setMapCenter(destination);
        return;
      }

      // Request directions from Google Maps Directions Service
      directionsServiceRef.current.route(
        {
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            // If the map is available, fit its bounds to the entire route
            if (mapRef.current) {
              mapRef.current.fitBounds(result.routes[0].bounds);
            }
          } else {
            console.error(`Directions request failed due to ${status}`);
            toast.error("Failed to load delivery route.");
            setDirections(null); // Clear directions on error
            // On failure, attempt to center the map on the intended origin or destination
            if (origin) {
                setMapCenter(origin);
            } else if (dropoffCoords) {
                setMapCenter(dropoffCoords);
            }
          }
        }
      );
    } else if (pickupCoords) {
        // If map is loaded but no route can be calculated, at least center on pickup
        setMapCenter(pickupCoords);
    } else if (dropoffCoords) {
        // Or center on dropoff
        setMapCenter(dropoffCoords);
    }
  }, [isLoaded, pickupCoords, dropoffCoords, riderLocation, showRouteFromRider]); // Re-run effect when these props change

  // Handle loading and error states for the Google Maps API script
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-red-600 bg-red-50 text-center">
        Error loading Google Maps: {loadError.message}. Please check your API key and internet connection.
      </div>
    );
  }

  if (!isLoaded || !apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl animate-pulse">Loading Map...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={mapCenter} // Map's initial center or adjusted center based on route calculation
      zoom={12} // Default zoom level
      onLoad={onLoad} // Callback when the map instance is loaded
      onUnmount={onUnmount} // Callback when the map instance is unmounted
      options={{
        zoomControl: true,       // Allow users to zoom
        streetViewControl: false, // Hide street view icon
        mapTypeControl: false,   // Hide map type selector (e.g., Satellite, Terrain)
        fullscreenControl: false, // Hide fullscreen button
      }}
    >
      {/* Marker for Pickup Location (Green Dot) */}
      {pickupCoords && (
        <MarkerF
          position={pickupCoords}
          label={{ text: "P", className: "map-label-pickup" }} // 'P' for Pickup
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", // Standard green dot icon
          }}
        />
      )}
      {/* Marker for Dropoff Location (Red Dot) */}
      {dropoffCoords && (
        <MarkerF
          position={dropoffCoords}
          label={{ text: "D", className: "map-label-dropoff" }} // 'D' for Dropoff
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // Standard red dot icon
          }}
        />
      )}
      {/* Marker for Rider's Current Location (Blue Dot) 
          Only shows if riderLocation is available, regardless of route origin preference.
      */}
      {riderLocation && (
        <MarkerF
          position={riderLocation}
          label={{ text: "You", className: "map-label-rider" }} // 'You' for Rider's position
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Standard blue dot icon
          }}
        />
      )}
      {/* Render the calculated directions route */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: {
              strokeColor: "#FF6347", // A distinct orange-red color for the route line
              strokeOpacity: 0.8,
              strokeWeight: 5,
            },
            suppressMarkers: true, // Prevent the default A/B markers from DirectionsRenderer, as we have custom ones
          }}
        />
      )}
    </GoogleMap>
  );
}
