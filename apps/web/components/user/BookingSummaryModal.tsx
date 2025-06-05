// components/user/BookingSummaryModal.tsx
"use client";

import React from "react";
import {
  Package,
  CalculatedOrderDetails,
  Rider,
} from "@/app/(root)/user/page"; // Import types from main page
import RiderSelection from "./RiderSelection"; // Import the new RiderSelection component

interface BookingSummaryModalProps {
  packages: Package[];
  calculatedOrderDetails: CalculatedOrderDetails;
  pricePerKm: number | null;
  riders: Rider[];
  nearestRiderInfo: { rider: Rider | null; distanceKm: number | null };
  showRiderSelectionDropdown: boolean;
  manuallySelectedRider: Rider | null;
  handleRiderSelectionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  confirmBooking: () => Promise<void>;
  setShowSummary: (show: boolean) => void;
  isBooking: boolean;
  isPriceConfigLoading: boolean;
  CLOSE_RIDER_THRESHOLD_KM: number;
}

const BookingSummaryModal: React.FC<BookingSummaryModalProps> = ({
  packages,
  calculatedOrderDetails,
  pricePerKm,
  riders,
  nearestRiderInfo,
  showRiderSelectionDropdown,
  manuallySelectedRider,
  handleRiderSelectionChange,
  confirmBooking,
  setShowSummary,
  isBooking,
  isPriceConfigLoading,
  CLOSE_RIDER_THRESHOLD_KM,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full md:w-1/2 lg:w-1/3 max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl flex flex-col">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">
          Confirm Booking
        </h3>
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm">
            <strong className="text-gray-700">Distance:</strong>{" "}
            {calculatedOrderDetails.distanceKm !== null
              ? `${calculatedOrderDetails.distanceKm} km`
              : "Calculating..."}
          </p>
          <p className="text-sm">
            <strong className="text-gray-700">Rate:</strong>{" "}
            {pricePerKm !== null ? `N${pricePerKm.toFixed(2)}/km` : "N/A"}
          </p>
          <p className="text-lg font-semibold">
            <strong className="text-gray-700">Est. Total:</strong>{" "}
            {calculatedOrderDetails.totalPrice !== null
              ? `N${calculatedOrderDetails.totalPrice.toFixed(2)}`
              : "Calculating..."}
          </p>
        </div>

        <RiderSelection
          riders={riders}
          nearestRiderInfo={nearestRiderInfo}
          showRiderSelectionDropdown={showRiderSelectionDropdown}
          manuallySelectedRider={manuallySelectedRider}
          handleRiderSelectionChange={handleRiderSelectionChange}
          isPriceConfigLoading={isPriceConfigLoading}
          CLOSE_RIDER_THRESHOLD_KM={CLOSE_RIDER_THRESHOLD_KM}
        />

        <div className="text-sm text-gray-500 mb-3">Packages:</div>
        <div className="space-y-2 mb-4 flex-grow overflow-y-auto max-h-[30vh]">
          {packages.map((pkg, i) => (
            <div
              key={i}
              className="border border-gray-200 p-3 rounded-lg bg-gray-50 text-xs"
            >
              <p className="font-semibold text-gray-700">Package #{i + 1}</p>
              <p>
                <strong className="text-gray-600">Pickup:</strong>{" "}
                {pkg.pickup?.text || "N/A"}
              </p>
              <p>
                <strong className="text-gray-600">Drop-off:</strong>{" "}
                {pkg.dropoff?.text || "N/A"}
              </p>
              <p>
                <strong className="text-gray-600">Qty:</strong> {pkg.quantity}{" "}
                {pkg.description && (
                  <span className="text-gray-500">
                    | Info: {pkg.description}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-auto pt-4 border-t">
          <button
            onClick={() => setShowSummary(false)}
            disabled={isBooking}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmBooking}
            disabled={
              isBooking ||
              (showRiderSelectionDropdown &&
                !manuallySelectedRider &&
                !nearestRiderInfo.rider &&
                riders.length > 0 &&
                riders.length > 0) || // Redundant riders.length > 0
              (riders.length === 0 && !isPriceConfigLoading) ||
              pricePerKm === null ||
              isPriceConfigLoading
            }
            className="px-5 py-2 cursor-pointer bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-wait"
          >
            {isBooking ? "Confirming..." : "Confirm & Pay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BookingSummaryModal);