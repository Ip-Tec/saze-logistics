// components/user/RiderSelection.tsx
"use client";

import React from "react";
import { Rider } from "@/app/(root)/user/page"; // Import types from main page

interface RiderSelectionProps {
  riders: Rider[];
  nearestRiderInfo: { rider: Rider | null; distanceKm: number | null };
  showRiderSelectionDropdown: boolean;
  manuallySelectedRider: Rider | null;
  handleRiderSelectionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isPriceConfigLoading: boolean;
  CLOSE_RIDER_THRESHOLD_KM: number;
}

const RiderSelection: React.FC<RiderSelectionProps> = ({
  riders,
  nearestRiderInfo,
  showRiderSelectionDropdown,
  manuallySelectedRider,
  handleRiderSelectionChange,
  isPriceConfigLoading,
  CLOSE_RIDER_THRESHOLD_KM,
}) => {
  return (
    <div className="mb-3 p-3 bg-orange-50 rounded-lg">
      <h4 className="text-md font-semibold text-gray-700 mb-1">
        Rider Information
      </h4>
      {!showRiderSelectionDropdown && nearestRiderInfo.rider && (
        <p className="text-sm">
          <strong className="text-gray-600">Assigned Rider (Nearest):</strong>{" "}
          {nearestRiderInfo.rider.name}
          {nearestRiderInfo.distanceKm !== null &&
            ` (~${nearestRiderInfo.distanceKm.toFixed(1)} km away)`}
        </p>
      )}
      {showRiderSelectionDropdown && (
        <div className="space-y-1">
          <label
            htmlFor="riderSelect"
            className="text-sm font-medium text-gray-600"
          >
            {nearestRiderInfo.rider
              ? `Nearest rider is ~${nearestRiderInfo.distanceKm?.toFixed(1)}km away. You can pick another:`
              : riders.length > 0
                ? "No riders very close. Please select one:"
                : ""}
          </label>
          {riders.length > 0 && (
            <select
              id="riderSelect"
              value={manuallySelectedRider?.id || ""}
              onChange={handleRiderSelectionChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">-- Select a Rider --</option>
              {riders
                .sort(
                  (a, b) =>
                    (a.distanceFromPickup ?? Infinity) -
                    (b.distanceFromPickup ?? Infinity)
                )
                .map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name}{" "}
                    {rider.distanceFromPickup !== undefined
                      ? `(~${rider.distanceFromPickup.toFixed(1)} km)`
                      : ""}
                  </option>
                ))}
            </select>
          )}
          {manuallySelectedRider &&
            manuallySelectedRider.distanceFromPickup &&
            manuallySelectedRider.distanceFromPickup >
              CLOSE_RIDER_THRESHOLD_KM && (
              <p className="text-xs text-orange-600 mt-1">
                Note: This rider is further away, arrival may take longer.
              </p>
            )}
        </div>
      )}
      {!nearestRiderInfo.rider &&
        !showRiderSelectionDropdown &&
        riders.length > 0 && (
          <p className="text-sm text-orange-600">
            Searching for available riders...
          </p>
        )}
      {riders.length === 0 && !isPriceConfigLoading && (
        <p className="text-sm text-red-600">No riders currently available.</p>
      )}
    </div>
  );
};

export default React.memo(RiderSelection); // Memoize for performance