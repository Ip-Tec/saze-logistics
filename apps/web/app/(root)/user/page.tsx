// app/(root)/user/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { supabase } from "@shared/supabaseClient";
import { type Database } from "@shared/supabase/types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Libraries } from "@react-google-maps/api";
import { useRouter } from "next/navigation"; // Import useRouter

// Import your new components and hooks
import MapContainer from "@/components/user/MapContainer";
import PackageForm from "@/components/user/PackageForm";
import BookingSummaryModal from "@/components/user/BookingSummaryModal";
import { useDeliveryPricing } from "@/hooks/user/useDeliveryPricing";
import { useRiderLocations } from "@/hooks/user/useRiderLocations";
import GlassButton from "@/components/ui/GlassButton";

// --- Constants & types ---
const MAP_LIBS: Libraries = ["places", "geocoding", "geometry"];
const EKPOMA_CENTER = { lat: 6.74, lng: 6.1381 };
const CLOSE_RIDER_THRESHOLD_KM = 5;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AddressDetail {
  text: string;
  coords: LatLng;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
}

export interface Package {
  pickup: AddressDetail | null;
  dropoff: AddressDetail | null;
  quantity: number;
  description: string;
}

export interface CalculatedOrderDetails {
  distanceKm: number | null;
  totalPrice: number | null;
}

export interface Rider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceFromPickup?: number;
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

export default function UserHomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBS,
  });
  const router = useRouter(); // Initialize router

  const [userLoc, setUserLoc] = useState<LatLng | undefined>(undefined);
  const [mapCenter, setMapCenter] = useState<LatLng>(EKPOMA_CENTER);

  const [packages, setPackages] = useState<Package[]>([
    { pickup: null, dropoff: null, quantity: 1, description: "" },
  ]);
  const [showSummary, setShowSummary] = useState(false);
  const [isBooking, setIsBooking] = useState(false); // Renamed from isProcessingPayment to isBooking
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [isManuallySettingUserLoc, setIsManuallySettingUserLoc] =
    useState(false);
  const [pickingLocationFor, setPickingLocationFor] = useState<{
    packageIndex: number;
    field: "pickup" | "dropoff";
  } | null>(null);
  const [tempMarkerPos, setTempMarkerPos] = useState<LatLng | null>(null);

  const [showRiderSelectionDropdown, setShowRiderSelectionDropdown] =
    useState(false);
  const [manuallySelectedRider, setManuallySelectedRider] =
    useState<Rider | null>(null);

  const pickupRefs = useRef<Array<google.maps.places.Autocomplete | null>>([]);
  const dropoffRefs = useRef<Array<google.maps.places.Autocomplete | null>>([]);

  // --- Hooks for Data and Logic ---
  const { pricing, isPriceConfigLoading } = useDeliveryPricing(isLoaded);
  const { riders, nearestRiderInfo, setFetchedRiders, setNearestRiderInfo } =
    useRiderLocations(
      isLoaded,
      packages[0]?.pickup?.coords,
      CLOSE_RIDER_THRESHOLD_KM
    );

  // Effect to manage rider selection dropdown visibility based on nearestRiderInfo
  useEffect(() => {
    console.log(
      "Rider selection effect running. Riders:",
      riders.length,
      "Nearest:",
      nearestRiderInfo.rider
    );
    if (!riders.length || !packages[0]?.pickup?.coords) {
      setNearestRiderInfo({ rider: null, distanceKm: null });
      setShowRiderSelectionDropdown(false);
      return;
    }

    const closestRider = nearestRiderInfo.rider;
    if (
      closestRider &&
      closestRider.distanceFromPickup !== undefined &&
      closestRider.distanceFromPickup > CLOSE_RIDER_THRESHOLD_KM
    ) {
      setShowRiderSelectionDropdown(true);
    } else {
      setShowRiderSelectionDropdown(false);
      setManuallySelectedRider(null);
    }

    if (!closestRider && riders.length > 0) {
      setShowRiderSelectionDropdown(true);
    }
  }, [
    riders,
    packages[0]?.pickup?.coords,
    nearestRiderInfo.rider,
    nearestRiderInfo.distanceKm,
    setNearestRiderInfo,
  ]);

  // --- Geocoding and Map Interaction Callbacks ---
  useEffect(() => {
    console.log("Geocoder initialization effect. isLoaded:", isLoaded);
    if (
      isLoaded &&
      typeof window.google !== "undefined" &&
      typeof window.google.maps !== "undefined" &&
      !geocoderRef.current
    ) {
      geocoderRef.current = new window.google.maps.Geocoder();
      console.log("Geocoder initialized:", geocoderRef.current);
    }
  }, [isLoaded]);

  // Diagnostic log for isLoaded state
  useEffect(() => {
    console.log(
      `useLoadScript: isLoaded changed to ${isLoaded}, loadError: ${loadError?.message}`
    );
    if (loadError) {
      toast.error(
        `Map loading error: ${loadError.message}. Check API key and network.`
      );
    }
  }, [isLoaded, loadError]);

  useEffect(() => {
    console.log("Fetching user and geolocation.");
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        console.log("User ID set:", user.id);
      } else {
        console.log("No user logged in.");
      }
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const currentLoc = { lat: coords.latitude, lng: coords.longitude };
          setUserLoc(currentLoc);
          setMapCenter(currentLoc);
          console.log("User geolocation obtained:", currentLoc);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          toast.info("Could not get your location. Set it manually or search.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error("Geolocation not supported by your browser.");
      console.warn("Geolocation not supported.");
    }
  }, []);

  const reverseGeocode = useCallback(
    async (coords: LatLng): Promise<AddressDetail | null> => {
      if (!geocoderRef.current) {
        toast.error("Geocoder not ready.");
        console.error(
          "Attempted reverseGeocode but geocoderRef.current is null."
        );
        return null;
      }
      try {
        const results = await geocoderRef.current.geocode({ location: coords });
        if (results && results.results[0]) {
          const place = results.results[0];
          const addressComponents: { [key: string]: string } = {};
          place.address_components.forEach((c) => {
            if (c.types[0]) addressComponents[c.types[0]] = c.long_name;
          });
          return {
            text: place.formatted_address || "",
            coords,
            street_number: addressComponents.street_number,
            route: addressComponents.route,
            locality:
              addressComponents.locality ||
              addressComponents.sublocality_level_1 ||
              addressComponents.postal_town,
            administrative_area_level_1:
              addressComponents.administrative_area_level_1,
            country: addressComponents.country,
            postal_code: addressComponents.postal_code,
          };
        } else {
          toast.warn("Could not find address for location.");
          console.warn("No address found for coords:", coords);
          return {
            text: `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(
              5
            )}`,
            coords,
          };
        }
      } catch (e: any) {
        console.error("Reverse geocode error:", e.message, e);
        toast.error("Error finding address.");
        return null;
      }
    },
    []
  );

  const handleMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      const clickedCoords = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setTempMarkerPos(clickedCoords);
      console.log("Map clicked at:", clickedCoords);

      if (isManuallySettingUserLoc) {
        setUserLoc(clickedCoords);
        setMapCenter(clickedCoords);
        const ad = await reverseGeocode(clickedCoords);
        toast.success(
          ad?.text ? `Your location: ${ad.text}` : "Location updated."
        );
        setIsManuallySettingUserLoc(false);
        setTempMarkerPos(null);
        console.log("User location set manually:", ad);
      } else if (pickingLocationFor) {
        const { packageIndex, field } = pickingLocationFor;
        const ad = await reverseGeocode(clickedCoords);
        if (ad) {
          setPackages((prev) => {
            const newPkgs = [...prev];
            newPkgs[packageIndex] = { ...newPkgs[packageIndex], [field]: ad };
            const inputRef =
              field === "pickup"
                ? pickupRefs?.current[packageIndex]
                : dropoffRefs?.current[packageIndex];

            if (inputRef) {
              const inputElement = (inputRef as any).i || (inputRef as any).A;
              if (inputElement && inputElement.value !== undefined) {
                inputElement.value = ad.text;
              }
            }
            return newPkgs;
          });
        }
        setPickingLocationFor(null);
        setTempMarkerPos(null);
        toast.success(`${field} for Package #${packageIndex + 1} set.`);
        console.log(`Package ${field} for #${packageIndex + 1} set to:`, ad);
      } else {
        setTempMarkerPos(null);
      }
    },
    [isManuallySettingUserLoc, pickingLocationFor, reverseGeocode]
  );

  const handleSetUserLocationManually = useCallback(() => {
    setIsManuallySettingUserLoc(true);
    setPickingLocationFor(null);
    toast.info("Click map to set your location.");
    console.log("Manual user location setting activated.");
  }, []);

  const handlePickLocationOnMap = useCallback(
    (packageIndex: number, field: "pickup" | "dropoff") => {
      setPickingLocationFor({ packageIndex, field });
      setIsManuallySettingUserLoc(false);
      toast.info(`Click map for ${field} of Package #${packageIndex + 1}.`);
      console.log(
        `Picking location for Package #${packageIndex + 1}, field: ${field}`
      );
    },
    []
  );

  const addPackage = useCallback(() => {
    setPackages((pkgs) => [
      ...pkgs,
      { pickup: null, dropoff: null, quantity: 1, description: "" },
    ]);
    toast.info("Added a new package slot.");
  }, []);

  const removePackage = useCallback((i: number) => {
    setPackages((pkgs) => pkgs.filter((_, j) => j !== i));
    toast.info(`Removed Package #${i + 1}.`);
  }, []);

  const handlePackageChange = useCallback(
    (
      index: number,
      field: keyof Package,
      value: AddressDetail | number | string
    ) => {
      setPackages((prev) =>
        prev.map((pkg, idx) =>
          idx === index ? { ...pkg, [field]: value } : pkg
        )
      );
    },
    []
  );

  // Calculate order details based on the first package
  const calculatedOrderDetails: CalculatedOrderDetails = useMemo(() => {
    console.log("Calculating order details with tiered pricing...");
    if (
      packages.length > 0 &&
      packages[0].pickup &&
      packages[0].dropoff &&
      // Check if BOTH low and high prices are available from the DB
      pricing.low !== null &&
      pricing.high !== null &&
      isLoaded &&
      typeof window.google !== "undefined" &&
      window.google.maps?.geometry
    ) {
      const pickupCoords = packages[0].pickup.coords;
      const dropoffCoords = packages[0].dropoff.coords;
      const distanceInMeters =
        window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng),
          new window.google.maps.LatLng(dropoffCoords.lat, dropoffCoords.lng)
        );
      const distanceInKm = distanceInMeters / 1000;
      const effectivePricePerKm =
        distanceInKm <= pricing.threshold ? pricing.low : pricing.high;

      const totalPrice = distanceInKm * effectivePricePerKm;
      console.log(
        `Distance: ${distanceInKm.toFixed(2)} km, Price: ${totalPrice.toFixed(2)}`
      );
      return {
        distanceKm: parseFloat(distanceInKm.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
      };
    }
    console.log("Order details not fully calculated yet.");
    return { distanceKm: null, totalPrice: null };
  }, [packages, pricing, isLoaded]);

  const handleRiderSelectionChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const riderId = event.target.value;
      const selected = riders.find((r) => r.id === riderId) || null;
      setManuallySelectedRider(selected);
      if (
        selected &&
        nearestRiderInfo.rider &&
        selected.id !== nearestRiderInfo.rider.id &&
        selected.distanceFromPickup &&
        nearestRiderInfo.distanceKm &&
        selected.distanceFromPickup > nearestRiderInfo.distanceKm
      ) {
        toast.warn("This rider is further away, arrival might take longer.");
      } else if (
        selected &&
        !nearestRiderInfo.rider &&
        selected.distanceFromPickup &&
        selected.distanceFromPickup > CLOSE_RIDER_THRESHOLD_KM * 2
      ) {
        toast.warn(
          "This rider is quite far, arrival might take significantly longer."
        );
      }
    },
    [riders, nearestRiderInfo.rider, nearestRiderInfo.distanceKm]
  );

  const confirmBooking = async () => {
    if (!userId) {
      toast.error("Not signed in. Please log in to book a delivery.");
      return;
    }
    if (!packages.length || packages.some((p) => !p.pickup || !p.dropoff)) {
      toast.error("Ensure all packages have pickup/dropoff locations set.");
      return;
    }
    if (
      pricing.low === null ||
      pricing.high === null ||
      calculatedOrderDetails.totalPrice === null
    ) {
      toast.error(
        "Price calculation error. Cannot book. Please try again later."
      );
      return;
    }

    let finalRiderId = nearestRiderInfo.rider?.id || null;
    if (showRiderSelectionDropdown && manuallySelectedRider) {
      finalRiderId = manuallySelectedRider.id;
    } else if (
      showRiderSelectionDropdown &&
      !manuallySelectedRider &&
      riders.length > 0
    ) {
      if (!nearestRiderInfo.rider?.id) {
        toast.error("Please select a rider from the list.");
        setIsBooking(false);
        return;
      }
      finalRiderId = nearestRiderInfo.rider.id;
    } else if (!finalRiderId && riders.length > 0) {
      toast.error("Please select a rider or wait for one to be assigned.");
      setIsBooking(false);
      return;
    } else if (riders.length === 0) {
      toast.warn(
        "No riders available for assignment. Booking will proceed without a rider for now."
      );
      finalRiderId = null;
    }

    setIsBooking(true);
    setShowSummary(false); // Close the summary modal immediately

    const orderData = {
      userId,
      riderId: finalRiderId,
      totalAmount: calculatedOrderDetails.totalPrice,
      distanceKm: calculatedOrderDetails.distanceKm,
      packages: packages.map((pkg) => ({
        pickup: pkg.pickup,
        dropoff: pkg.dropoff,
        quantity: pkg.quantity,
        description: pkg.description,
      })),
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem("pendingOrderDetails", JSON.stringify(orderData));
      router.push("/user/checkout");
      console.log("Order details stored, redirecting to checkout.");
    } catch (error) {
      console.error("Error storing order details for checkout:", error);
      toast.error("Could not proceed to checkout. Please try again.");
      setIsBooking(false);
    }
  };

  console.log(
    "Rendering UserHomePage. isLoaded:",
    isLoaded,
    "loadError:",
    loadError?.message,
    "geocoderRef.current:",
    geocoderRef.current
  );

  // If API key is explicitly missing from the environment
  if (!apiKey)
    return (
      <div className="flex items-center justify-center h-screen p-4 text-orange-600 bg-orange-50 text-center">
        Map API key is missing. Please configure{" "}
        <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
      </div>
    );

  // If useLoadScript reports a loading error
  if (loadError)
    return (
      <div className="flex items-center justify-center h-screen p-4 text-red-600 bg-red-50 text-center">
        Error loading Google Maps: {loadError.message}.<br />
        Please check your API key, internet connection, and Google Cloud Console
        settings (enabled APIs, restrictions).
      </div>
    );

  // If useLoadScript is still loading
  if (
    !isLoaded ||
    typeof window.google === "undefined" ||
    typeof window.google.maps === "undefined"
  )
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl animate-pulse text-gray-700">
          Loading Map Interface & Services…
        </p>
      </div>
    );

  // If Geocoder is still initializing (should happen right after isLoaded)
  if (!geocoderRef.current && isLoaded)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl animate-pulse text-gray-700">
          Initializing Geocoding Service...
        </p>
      </div>
    );

  // If all checks pass, render the main UI
  return (
    <div className="mb-24 md:mb-0 relative flex flex-col md:flex-row h-screen w-full font-sans">
      {" "}
      {/* Added pb-[72px] for mobile bottom navbar previously, now using mb-24 */}
      <ToastContainer position="top-right" autoClose={5000} />
      <MapContainer
        mapCenter={mapCenter}
        onMapLoad={(map) => {
          mapRef.current = map;
          console.log("GoogleMap instance loaded into ref.");
        }}
        userLoc={userLoc}
        riders={riders}
        nearestRiderInfo={nearestRiderInfo}
        tempMarkerPos={tempMarkerPos}
        handleMapClick={handleMapClick}
        isManuallySettingUserLoc={isManuallySettingUserLoc}
        pickingLocationFor={pickingLocationFor}
        handleSetUserLocationManually={handleSetUserLocationManually}
      />
      <div className="md:w-1/3 bg-gray-50 p-4 overflow-y-auto h-1/2 md:h-full shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          Request Delivery
        </h2>
        {isPriceConfigLoading && (
          <p className="text-sm text-blue-600 mb-2 animate-pulse">
            Loading delivery rate...
          </p>
        )}
        {pricing.high === null || pricing.low === null && !isPriceConfigLoading && (
          <p className="text-sm text-red-600 mb-2">
            Delivery rate not available. Booking disabled.
          </p>
        )}

        {packages.map((pkg, i) => (
          <PackageForm
            key={i}
            packageIndex={i}
            pkg={pkg}
            packagesLength={packages.length}
            handlePackageChange={handlePackageChange}
            removePackage={removePackage}
            handlePickLocationOnMap={handlePickLocationOnMap}
            pickupRefs={pickupRefs}
            dropoffRefs={dropoffRefs}
            mapRef={mapRef} // Pass mapRef for Autocomplete bounds
          />
        ))}

        <button
          onClick={addPackage}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full text-sm font-medium transition-colors"
        >
          {" "}
          + Add Package{" "}
        </button>
        <GlassButton
          onClick={() => setShowSummary(true)}
          disabled={
            isBooking ||
            packages.some((p) => !p.pickup || !p.dropoff) ||
            pricing.low === null ||
            pricing.high === null ||
            isPriceConfigLoading
          }
          className="w-full !bg-orange-600 hover:!bg-orange-700 !py-3 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isPriceConfigLoading
            ? "Loading Rate..."
            : pricing.low === null || pricing.high === null
              ? "Rate Unavailable"
              : isBooking
                ? "Proceeding to Payment..."
                : "Review & Confirm"}
        </GlassButton>
      </div>
      {showSummary && (
        <BookingSummaryModal
          packages={packages}
          calculatedOrderDetails={calculatedOrderDetails}
          pricing={pricing}
          riders={riders}
          nearestRiderInfo={nearestRiderInfo}
          showRiderSelectionDropdown={showRiderSelectionDropdown}
          manuallySelectedRider={manuallySelectedRider}
          handleRiderSelectionChange={handleRiderSelectionChange}
          confirmBooking={confirmBooking}
          setShowSummary={setShowSummary}
          isBooking={isBooking}
          isPriceConfigLoading={isPriceConfigLoading}
          CLOSE_RIDER_THRESHOLD_KM={CLOSE_RIDER_THRESHOLD_KM}
        />
      )}
    </div>
  );
}
