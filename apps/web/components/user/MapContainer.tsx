// components/user/MapContainer.tsx
"use client";

import React, { useCallback } from "react";
import { GoogleMap, Marker, OverlayView } from "@react-google-maps/api";
import {
  LatLng,
  Rider,
  CalculatedOrderDetails,
  AddressDetail,
} from "@/app/(root)/user/page"; // Import types from main page

interface MapContainerProps {
  mapCenter: LatLng;
  onMapLoad: (map: google.maps.Map) => void;
  userLoc: LatLng | undefined;
  riders: Rider[];
  nearestRiderInfo: { rider: Rider | null; distanceKm: number | null };
  tempMarkerPos: LatLng | null;
  handleMapClick: (event: google.maps.MapMouseEvent) => void;
  isManuallySettingUserLoc: boolean;
  pickingLocationFor: {
    packageIndex: number;
    field: "pickup" | "dropoff";
  } | null;
  handleSetUserLocationManually: () => void;
}

const MAP_STYLE = { width: "100%", height: "100%" };

const MapContainer: React.FC<MapContainerProps> = ({
  mapCenter,
  onMapLoad,
  userLoc,
  riders,
  nearestRiderInfo,
  tempMarkerPos,
  handleMapClick,
  isManuallySettingUserLoc,
  pickingLocationFor,
  handleSetUserLocationManually,
}) => {
  return (
    <div className="flex-1 relative h-1/2 md:h-full">
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={mapCenter}
        zoom={13}
        onLoad={onMapLoad}
        onClick={handleMapClick}
        options={{
          gestureHandling: "greedy",
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {userLoc && (
          <Marker
            position={userLoc}
            label={{
              text: "You",
              fontWeight: "bold",
              color: "white",
              className: "bg-blue-500 px-2 py-1 rounded-md",
            }}
          />
        )}
        {riders.map(
          (r) =>
            r.lat !== 0 &&
            r.lng !== 0 && (
              <Marker
                key={r.id}
                position={{ lat: r.lat, lng: r.lng }}
                title={`${r.name} (${r.distanceFromPickup !== undefined ? r.distanceFromPickup + "km away" : "Dist. unknown"})`}
              />
            )
        )}
        {nearestRiderInfo.rider &&
          nearestRiderInfo.rider.lat !== 0 &&
          nearestRiderInfo.rider.lng !== 0 && (
            <OverlayView
              position={{
                lat: nearestRiderInfo.rider.lat,
                lng: nearestRiderInfo.rider.lng,
              }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="bg-orange-500 text-white p-2 rounded-lg shadow-lg text-xs font-semibold whitespace-nowrap">
                Nearest: {nearestRiderInfo.rider.name} (
                {nearestRiderInfo.distanceKm?.toFixed(1)} km)
              </div>
            </OverlayView>
          )}
        {tempMarkerPos && (
          <Marker
            position={tempMarkerPos}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#FF0000",
              fillOpacity: 0.7,
              strokeWeight: 0,
            }}
          />
        )}
      </GoogleMap>
      <div className="absolute top-2 left-2 z-10 bg-white p-2 rounded-md shadow-md space-y-1">
        <button
          onClick={handleSetUserLocationManually}
          className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isManuallySettingUserLoc
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {isManuallySettingUserLoc
            ? "Picking Your Location..."
            : "Set My Location"}
        </button>
        {pickingLocationFor && (
          <p className="text-xs p-1 bg-orange-100 text-orange-700 rounded">
            Click map for {pickingLocationFor.field} (Pkg #
            {pickingLocationFor.packageIndex + 1})
          </p>
        )}
      </div>
    </div>
  );
};

export default React.memo(MapContainer);