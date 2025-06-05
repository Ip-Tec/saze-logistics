// components/user/PackageForm.tsx
"use client";

import React, { useCallback } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { Package, AddressDetail } from "@/app/(root)/user/page"; // Import types from main page

interface PackageFormProps {
  packageIndex: number;
  pkg: Package;
  packagesLength: number;
  handlePackageChange: (
    index: number,
    field: keyof Package,
    value: AddressDetail | number | string
  ) => void;
  removePackage: (index: number) => void;
  handlePickLocationOnMap: (
    packageIndex: number,
    field: "pickup" | "dropoff"
  ) => void;
  pickupRefs: React.MutableRefObject<
    (google.maps.places.Autocomplete | null)[]
  >;
  dropoffRefs: React.MutableRefObject<
    (google.maps.places.Autocomplete | null)[]
  >;
  mapRef: React.MutableRefObject<google.maps.Map | null>;
}

const PackageForm: React.FC<PackageFormProps> = ({
  packageIndex: i,
  pkg,
  packagesLength,
  handlePackageChange,
  removePackage,
  handlePickLocationOnMap,
  pickupRefs,
  dropoffRefs,
  mapRef,
}) => {
  const onLoadAutocomplete = useCallback(
    (
      refList: React.MutableRefObject<
        (google.maps.places.Autocomplete | null)[]
      >,
      idx: number,
      ac: google.maps.places.Autocomplete | null
    ) => {
      if (ac) {
        refList.current[idx] = ac;
        if (mapRef.current) {
          const b = mapRef.current.getBounds();
          if (b) ac.setBounds(b);
        }
      }
    },
    [mapRef]
  );

  const onPlaceChanged = useCallback(
    (
      refList: React.MutableRefObject<
        (google.maps.places.Autocomplete | null)[]
      >,
      idx: number,
      field: "pickup" | "dropoff"
    ) => {
      const ac = refList.current[idx];
      if (!ac) return;
      const place = ac.getPlace();
      if (!place.geometry?.location || !place.address_components) {
        // toast.warn("Place lacks details."); // This toast should ideally come from parent/main component
        return;
      }
      const coords = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      const adComps: { [key: string]: string } = {};
      place.address_components.forEach((c) => {
        if (c.types[0]) adComps[c.types[0]] = c.long_name;
      });
      const newAd: AddressDetail = {
        text: place.formatted_address || place.name || "",
        coords,
        street_number: adComps.street_number,
        route: adComps.route,
        locality:
          adComps.locality ||
          adComps.sublocality_level_1 ||
          adComps.postal_town,
        administrative_area_level_1: adComps.administrative_area_level_1,
        country: adComps.country,
        postal_code: adComps.postal_code,
      };
      handlePackageChange(idx, field, newAd);
      if (mapRef.current) mapRef.current.panTo(coords);
    },
    [handlePackageChange, mapRef]
  );

  return (
    <div className="border border-gray-200 bg-white rounded-xl p-4 mb-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-center">
        <strong className="text-lg text-gray-600">Package #{i + 1}</strong>
        {packagesLength > 1 && (
          <button
            onClick={() => removePackage(i)}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Remove
          </button>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-500">
          Pickup Location
        </label>
        <div className="flex items-center gap-2">
          <Autocomplete
            onLoad={(ac) => onLoadAutocomplete(pickupRefs, i, ac)}
            onPlaceChanged={() => onPlaceChanged(pickupRefs, i, "pickup")}
            options={{ types: ["address"] }}
            className="flex-grow"
          >
            <input
              type="text"
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="Search or pick on map"
              defaultValue={pkg.pickup?.text || ""}
            />
          </Autocomplete>
          <button
            onClick={() => handlePickLocationOnMap(i, "pickup")}
            className="p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-xs font-medium"
            title="Pick on map"
          >
            Map
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-500">
          Drop-off Location
        </label>
        <div className="flex items-center gap-2">
          <Autocomplete
            onLoad={(ac) => onLoadAutocomplete(dropoffRefs, i, ac)}
            onPlaceChanged={() => onPlaceChanged(dropoffRefs, i, "dropoff")}
            options={{ types: ["address"] }}
            className="flex-grow"
          >
            <input
              type="text"
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="Search or pick on map"
              defaultValue={pkg.dropoff?.text || ""}
            />
          </Autocomplete>
          <button
            onClick={() => handlePickLocationOnMap(i, "dropoff")}
            className="p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-xs font-medium"
            title="Pick on map"
          >
            Map
          </button>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="space-y-1 w-1/3">
          <label
            htmlFor={`quantity-${i}`}
            className="text-sm font-medium text-gray-500"
          >
            Qty
          </label>
          <input
            id={`quantity-${i}`}
            type="number"
            min={1}
            value={pkg.quantity}
            onChange={(e) => {
              const q = parseInt(e.target.value);
              if (q >= 1) handlePackageChange(i, "quantity", q);
            }}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="space-y-1 flex-grow">
          <label
            htmlFor={`description-${i}`}
            className="text-sm font-medium text-gray-500"
          >
            Description
          </label>
          <input
            id={`description-${i}`}
            value={pkg.description}
            onChange={(e) => handlePackageChange(i, "description", e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g., fragile items"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(PackageForm);