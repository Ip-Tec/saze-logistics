// app/(root)/user/UserHomePage.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  Autocomplete,
  OverlayView,
} from "@react-google-maps/api";
import { supabase } from "@shared/supabaseClient";
import { type Database } from "@shared/supabase/types";
type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

import GlassButton from "@/components/ui/GlassButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Libraries } from "@react-google-maps/api";

// --- Constants & types ---
const MAP_LIBS: Libraries = ["places", "geocoding", "geometry"];
const MAP_STYLE = { width: "100%", height: "100%" };
const EKPOMA_CENTER = { lat: 6.74, lng: 6.1381 };
const PRICE_PER_KM_CONFIG_KEY = "price_per_km";
const CLOSE_RIDER_THRESHOLD_KM = 5;

type LatLng = google.maps.LatLngLiteral;

interface Rider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceFromPickup?: number;
}

interface AddressDetail {
  text: string;
  coords: LatLng;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
}

interface Package {
  pickup: AddressDetail | null;
  dropoff: AddressDetail | null;
  quantity: number;
  description: string;
}

interface CalculatedOrderDetails {
  distanceKm: number | null;
  totalPrice: number | null;
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

export default function UserHomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey, // Ensure apiKey is not empty or undefined for useLoadScript
    libraries: MAP_LIBS,
  });

  const [userLoc, setUserLoc] = useState<LatLng | undefined>(undefined);
  const [mapCenter, setMapCenter] = useState<LatLng>(EKPOMA_CENTER);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [nearestRiderInfo, setNearestRiderInfo] = useState<{
    rider: Rider | null;
    distanceKm: number | null;
  }>({ rider: null, distanceKm: null });

  const [packages, setPackages] = useState<Package[]>([
    { pickup: null, dropoff: null, quantity: 1, description: "" },
  ]);
  const [showSummary, setShowSummary] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [isManuallySettingUserLoc, setIsManuallySettingUserLoc] =
    useState(false);
  const [pickingLocationFor, setPickingLocationFor] = useState<{
    packageIndex: number;
    field: "pickup" | "dropoff";
  } | null>(null);
  const [tempMarkerPos, setTempMarkerPos] = useState<LatLng | null>(null);

  const [pricePerKm, setPricePerKm] = useState<number | null>(null);
  const [isPriceConfigLoading, setIsPriceConfigLoading] = useState(true);
  const [calculatedOrderDetails, setCalculatedOrderDetails] =
    useState<CalculatedOrderDetails>({ distanceKm: null, totalPrice: null });
  const [showRiderSelectionDropdown, setShowRiderSelectionDropdown] =
    useState(false);
  const [manuallySelectedRider, setManuallySelectedRider] =
    useState<Rider | null>(null);

  const pickupRefs = useRef<Array<google.maps.places.Autocomplete | null>>([]);
  const dropoffRefs = useRef<Array<google.maps.places.Autocomplete | null>>([]);

  // Initialize Geocoder Effect
  useEffect(() => {
    // Initialize geocoder only when API is loaded and window.google.maps is available
    if (
      isLoaded &&
      typeof window.google !== "undefined" &&
      typeof window.google.maps !== "undefined" &&
      !geocoderRef.current
    ) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]); // Re-run if isLoaded changes

  // Get user & geolocation
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const currentLoc = { lat: coords.latitude, lng: coords.longitude };
          setUserLoc(currentLoc);
          setMapCenter(currentLoc);
        },
        () =>
          toast.info("Could not get your location. Set it manually or search."),
        { enableHighAccuracy: true }
      );
    } else {
      toast.error("Geolocation not supported.");
    }
  }, []);

  // Fetch Price Per KM from config table
  useEffect(() => {
    async function fetchPriceConfig() {
      if (!isLoaded) return; // Ensure API is loaded before fetching anything that might depend on it indirectly
      setIsPriceConfigLoading(true);
      try {
        const { data, error } = await supabase
          .from("config")
          .select("value")
          .eq("key", PRICE_PER_KM_CONFIG_KEY)
          .single();

        if (error) {
          // If error is "PGRST116" (JSON object requested, multiple (or no) rows returned), it means key not found or multiple keys
          if (error.code === "PGRST116") {
            toast.warn(
              `Price/km configuration (key: ${PRICE_PER_KM_CONFIG_KEY}) not found or is ambiguous in DB. Booking disabled.`
            );
          } else {
            throw error;
          }
          setPricePerKm(null);
        } else if (data && data.value) {
          const parsedPrice = parseFloat(data.value);
          if (!isNaN(parsedPrice)) {
            setPricePerKm(parsedPrice);
          } else {
            toast.error(
              `Invalid price/km value in DB for key: ${PRICE_PER_KM_CONFIG_KEY}. Booking disabled.`
            );
            setPricePerKm(null);
          }
        } else {
          // This case should be covered by PGRST116 if .single() is used and no row found
          toast.warn(
            `Price/km configuration (key: ${PRICE_PER_KM_CONFIG_KEY}) not found in DB. Booking disabled.`
          );
          setPricePerKm(null);
        }
      } catch (err: any) {
        toast.error(
          `Error fetching price/km: ${err.message}. Booking disabled.`
        );
        setPricePerKm(null);
      } finally {
        setIsPriceConfigLoading(false);
      }
    }
    fetchPriceConfig();
  }, [isLoaded]); // Depend on isLoaded

  // Calculate distance and total price for the order
  useEffect(() => {
    // Ensure all conditions are met, including window.google.maps.geometry for distance calculation
    if (
      packages.length > 0 &&
      packages[0].pickup &&
      packages[0].dropoff &&
      pricePerKm !== null &&
      isLoaded &&
      typeof window.google !== "undefined" &&
      window.google.maps &&
      window.google.maps.geometry
    ) {
      const pickupCoords = packages[0].pickup.coords;
      const dropoffCoords = packages[0].dropoff.coords;

      const distanceInMeters =
        window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng),
          new window.google.maps.LatLng(dropoffCoords.lat, dropoffCoords.lng)
        );
      const distanceInKm = distanceInMeters / 1000;
      const totalPrice = distanceInKm * pricePerKm;

      setCalculatedOrderDetails({
        distanceKm: parseFloat(distanceInKm.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
      });
    } else {
      setCalculatedOrderDetails({ distanceKm: null, totalPrice: null });
    }
  }, [packages, pricePerKm, isLoaded]); // isLoaded ensures google.maps.geometry is available

  // Load riders
  useEffect(() => {
    async function fetchRidersData() {
      const { data: ridersData, error: ridersErr } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "rider")
        .eq("status", "active");

      if (ridersErr) {
        toast.error("Error fetching riders: " + ridersErr.message);
        return;
      }
      if (!ridersData || ridersData.length === 0) {
        setRiders([]);
        return;
      }
      const ids = ridersData.map((r) => r.id);
      const { data: locs, error: locErr } = await supabase
        .from("rider_location")
        .select("rider_id, latitude, longitude, recorded_at")
        .in("rider_id", ids)
        .order("recorded_at", { ascending: false });

      if (locErr) {
        toast.error("Error fetching rider locations: " + locErr.message);
        return;
      }
      const latestMap = new Map<string, { lat: number; lng: number }>();
      locs?.forEach((l) => {
        if (
          l.rider_id &&
          !latestMap.has(l.rider_id) &&
          typeof l.latitude === "number" &&
          typeof l.longitude === "number"
        ) {
          latestMap.set(l.rider_id, { lat: l.latitude, lng: l.longitude });
        }
      });
      const list: Rider[] = ridersData.map((r) => ({
        id: r.id,
        name: r.name || "Unnamed Rider",
        lat: latestMap.get(r.id)?.lat || 0,
        lng: latestMap.get(r.id)?.lng || 0,
      }));
      setRiders(list);
    }
    if (isLoaded) fetchRidersData(); // Ensure Google Maps API is loaded before any operation that might depend on it
  }, [isLoaded]);

  // Real-time rider location updates
  useEffect(() => {
    if (!isLoaded) return;
    const channel = supabase
      .channel("rider_live_location_updates_v3") // Ensure unique channel name per instance if needed
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rider_location" },
        (payload) => {
          const { rider_id, latitude, longitude } = payload.new;
          if (
            rider_id &&
            typeof latitude === "number" &&
            typeof longitude === "number"
          ) {
            setRiders((prevRiders) =>
              prevRiders.map((r) =>
                r.id === rider_id ? { ...r, lat: latitude, lng: longitude } : r
              )
            );
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED")
          console.log("Subscribed to rider_location inserts_v3");
        else if (err || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Subscription error v3:", err || status);
          toast.error("Rider update issue.");
        }
      });
    return () => {
      supabase
        .removeChannel(channel)
        .catch((err) => console.error("Error removing channel", err));
    };
  }, [isLoaded, supabase]);

  // Compute nearest rider and update distances for all riders from pickup
  useEffect(() => {
    if (
      !packages[0]?.pickup?.coords ||
      !riders.length ||
      !isLoaded ||
      typeof window.google === "undefined" ||
      !window.google.maps ||
      !window.google.maps.geometry
    ) {
      setNearestRiderInfo({ rider: null, distanceKm: null });
      setRiders((prevRiders) =>
        prevRiders.map((r) => ({ ...r, distanceFromPickup: undefined }))
      );
      return;
    }

    const pickupLocation = new window.google.maps.LatLng(
      packages[0].pickup.coords.lat,
      packages[0].pickup.coords.lng
    );

    let closestRider: Rider | null = null;
    let minDistanceKm = Infinity;

    const ridersWithDistances = riders.map((rider) => {
      if (rider.lat === 0 && rider.lng === 0)
        return { ...rider, distanceFromPickup: undefined };
      const riderLocation = new window.google.maps.LatLng(rider.lat, rider.lng);
      const distanceMeters =
        window.google.maps.geometry.spherical.computeDistanceBetween(
          pickupLocation,
          riderLocation
        );
      const distanceKm = parseFloat((distanceMeters / 1000).toFixed(2));

      if (distanceKm < minDistanceKm) {
        minDistanceKm = distanceKm;
        closestRider = rider;
      }
      return { ...rider, distanceFromPickup: distanceKm };
    });

    setRiders(ridersWithDistances);

    if (closestRider) {
      setNearestRiderInfo({ rider: closestRider, distanceKm: minDistanceKm });
      if (
        minDistanceKm > CLOSE_RIDER_THRESHOLD_KM &&
        ridersWithDistances.length > 0
      ) {
        setShowRiderSelectionDropdown(true);
      } else {
        setShowRiderSelectionDropdown(false);
        setManuallySelectedRider(null);
      }
    } else {
      setNearestRiderInfo({ rider: null, distanceKm: null });
      setShowRiderSelectionDropdown(ridersWithDistances.length > 0);
    }
  }, [riders, packages[0]?.pickup?.coords, isLoaded]); // isLoaded dependency implicitly covers google.maps.geometry availability via the guard at the top

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      map.panTo(mapCenter);
    },
    [mapCenter]
  );

  const reverseGeocode = useCallback(
    async (coords: LatLng): Promise<AddressDetail | null> => {
      if (!geocoderRef.current) {
        toast.error("Geocoder not ready.");
        return null;
      } // Check if geocoderRef is initialized
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
          return {
            text: `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`,
            coords,
          };
        }
      } catch (e) {
        console.error("Reverse geocode error:", e);
        toast.error("Error finding address.");
        return null;
      }
    },
    []
  ); // geocoderRef is stable once set

  const handleMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      const clickedCoords = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setTempMarkerPos(clickedCoords);
      if (isManuallySettingUserLoc) {
        setUserLoc(clickedCoords);
        setMapCenter(clickedCoords);
        const ad = await reverseGeocode(clickedCoords);
        toast.success(
          ad?.text ? `Your location: ${ad.text}` : "Location updated."
        );
        setIsManuallySettingUserLoc(false);
        setTempMarkerPos(null);
      } else if (pickingLocationFor) {
        const { packageIndex, field } = pickingLocationFor;
        const ad = await reverseGeocode(clickedCoords);
        if (ad) {
          setPackages((prev) => {
            const newPkgs = [...prev];
            newPkgs[packageIndex] = { ...newPkgs[packageIndex], [field]: ad };
            return newPkgs;
          });
        }
        setPickingLocationFor(null);
        setTempMarkerPos(null);
        toast.success(`${field} for Package #${packageIndex + 1} set.`);
      } else {
        setTempMarkerPos(null);
      }
    },
    [isManuallySettingUserLoc, pickingLocationFor, reverseGeocode]
  );

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
    []
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
        toast.warn("Place lacks details.");
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
      setPackages((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [field]: newAd };
        return copy;
      });
      if (mapRef.current) mapRef.current.panTo(coords);
    },
    []
  );

  const addPackage = () =>
    setPackages((pkgs) => [
      ...pkgs,
      { pickup: null, dropoff: null, quantity: 1, description: "" },
    ]);
  const removePackage = (i: number) =>
    setPackages((pkgs) => pkgs.filter((_, j) => j !== i));
  const handleSetUserLocationManually = () => {
    setIsManuallySettingUserLoc(true);
    setPickingLocationFor(null);
    toast.info("Click map to set your location.");
  };
  const handlePickLocationOnMap = (
    packageIndex: number,
    field: "pickup" | "dropoff"
  ) => {
    setPickingLocationFor({ packageIndex, field });
    setIsManuallySettingUserLoc(false);
    toast.info(`Click map for ${field} of Package #${packageIndex + 1}.`);
  };

  const handleRiderSelectionChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
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
  };

  const confirmBooking = async () => {
    if (!userId) {
      toast.error("Not signed in.");
      return;
    }
    if (!packages.length || packages.some((p) => !p.pickup || !p.dropoff)) {
      toast.error("Ensure all packages have pickup/dropoff.");
      return;
    }
    if (pricePerKm === null || calculatedOrderDetails.totalPrice === null) {
      toast.error("Price calculation error. Cannot book. Check price config.");
      return;
    }

    setIsBooking(true);
    try {
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
      }

      let primaryDropoffAddressId: string | undefined = undefined;
      const firstPackageDropoff = packages[0]?.dropoff;
      if (firstPackageDropoff) {
        const deliveryAddressPayload: TablesInsert<"delivery_address"> = {
          street:
            `${firstPackageDropoff.street_number || ""} ${firstPackageDropoff.route || ""}`.trim() ||
            firstPackageDropoff.text ||
            "N/A",
          city: firstPackageDropoff.locality || "N/A",
          state: firstPackageDropoff.administrative_area_level_1 || "N/A",
          country: firstPackageDropoff.country || "N/A",
          postal_code: firstPackageDropoff.postal_code || null,
          lat: firstPackageDropoff.coords.lat,
          lng: firstPackageDropoff.coords.lng,
          user_id: userId,
        };
        const { data, error } = await supabase
          .from("delivery_address")
          .insert(deliveryAddressPayload)
          .select("id")
          .single();
        if (error)
          throw new Error(`Dropoff address save failed: ${error.message}`);
        primaryDropoffAddressId = data.id;
      }

      const orderPayload: TablesInsert<"order"> = {
        user_id: userId,
        rider_id: finalRiderId,
        status: "pending_confirmation",
        total_amount: calculatedOrderDetails.totalPrice,
        payment_method: "pending",
        special_instructions: `Order for ${packages.length} package(s). Distance: ${calculatedOrderDetails.distanceKm}km.`,
        delivery_address_id: primaryDropoffAddressId || null,
      };
      const { data: orderData, error: orderError } = await supabase
        .from("order")
        .insert(orderPayload)
        .select("id")
        .single();
      if (orderError)
        throw new Error(`Order creation failed: ${orderError.message}`);
      const orderId = orderData.id;

      const orderItemsPayload: TablesInsert<"order_item">[] = packages.map(
        (pkg) => {
          if (!pkg.pickup || !pkg.dropoff)
            throw new Error("Package details missing.");
          return {
            order_id: orderId,
            quantity: pkg.quantity,
            notes: JSON.stringify({
              pickup_address: pkg.pickup.text,
              pickup_coords: pkg.pickup.coords,
              dropoff_address: pkg.dropoff.text,
              dropoff_coords: pkg.dropoff.coords,
              item_description: pkg.description,
            }),
            price: 0,
            menu_item_id: null,
          };
        }
      );
      const { error: orderItemsError } = await supabase
        .from("order_item")
        .insert(orderItemsPayload);
      if (orderItemsError) {
        await supabase.from("order").delete().eq("id", orderId);
        if (primaryDropoffAddressId)
          await supabase
            .from("delivery_address")
            .delete()
            .eq("id", primaryDropoffAddressId);
        throw new Error(
          `Package save failed: ${orderItemsError.message}. Booking cancelled.`
        );
      }

      toast.success(
        `Booking confirmed! Order ID: ${orderId}. Total: N${calculatedOrderDetails.totalPrice?.toFixed(2)}`
      );
      setShowSummary(false);
      setPackages([
        { pickup: null, dropoff: null, quantity: 1, description: "" },
      ]);
      setManuallySelectedRider(null);
      setShowRiderSelectionDropdown(false);
    } catch (error: any) {
      console.error("Booking failed:", error);
      toast.error(error.message || "Booking error.");
    } finally {
      setIsBooking(false);
    }
  };

  // --- Render ---
  // Initial check for API Key
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-screen p-4 text-orange-600 bg-orange-50 text-center">
        Map API key is missing. Please configure{" "}
        <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
      </div>
    );
  }
  // Check for script load error
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen p-4 text-red-600 bg-red-50 text-center">
        Error loading Google Maps: {loadError.message}.
        <br />
        Please check your API key, internet connection, and Google Cloud Console
        settings for the Maps JavaScript API.
      </div>
    );
  }
  // Main loading guard: wait for isLoaded AND window.google.maps to be defined
  if (
    !isLoaded ||
    typeof window.google === "undefined" ||
    typeof window.google.maps === "undefined"
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl animate-pulse">
          Loading Map Interface & Services…
        </p>
      </div>
    );
  }
  // Additional check for geocoder, though primary map can render without it if reverseGeocode handles its absence
  if (!geocoderRef.current && isLoaded) {
    // This condition means isLoaded is true, google.maps is there, but geocoder isn't set yet.
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl animate-pulse">
          Initializing Geocoding Service...
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col md:flex-row h-screen w-full font-sans">
      <ToastContainer position="top-right" autoClose={5000} />
      {/* Map Section */}
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
                  // Example: Custom icon for riders
                  // icon={{ url: '/icons/rider-pin.svg', scaledSize: new window.google.maps.Size(30, 30) }}
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
            className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isManuallySettingUserLoc ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
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

      {/* Controls Section */}
      <div className="md:w-1/3 bg-gray-50 p-4 overflow-y-auto h-1/2 md:h-full shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          Request Delivery
        </h2>
        {isPriceConfigLoading && (
          <p className="text-sm text-blue-600 mb-2 animate-pulse">
            Loading delivery rate...
          </p>
        )}
        {pricePerKm === null && !isPriceConfigLoading && (
          <p className="text-sm text-red-600 mb-2">
            Delivery rate not available. Booking disabled.
          </p>
        )}

        {packages.map((pkg, i) => (
          <div
            key={i}
            className="border border-gray-200 bg-white rounded-xl p-4 mb-4 space-y-3 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <strong className="text-lg text-gray-600">
                Package #{i + 1}
              </strong>
              {packages.length > 1 && (
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
                  onPlaceChanged={() =>
                    onPlaceChanged(dropoffRefs, i, "dropoff")
                  }
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
                    if (q >= 1)
                      setPackages((prev) =>
                        prev.map((p, idx) =>
                          idx === i ? { ...p, quantity: q } : p
                        )
                      );
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setPackages((prev) =>
                      prev.map((p, idx) =>
                        idx === i ? { ...p, description: v } : p
                      )
                    );
                  }}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., fragile items"
                />
              </div>
            </div>
          </div>
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
            pricePerKm === null ||
            isPriceConfigLoading
          }
          className="w-full !bg-orange-600 hover:!bg-orange-700 !py-3 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPriceConfigLoading
            ? "Loading Rate..."
            : pricePerKm === null
              ? "Rate Unavailable"
              : isBooking
                ? "Processing..."
                : "Review & Confirm"}
        </GlassButton>
      </div>

      {/* Summary Modal */}
      {showSummary && (
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

            <div className="mb-3 p-3 bg-orange-50 rounded-lg">
              <h4 className="text-md font-semibold text-gray-700 mb-1">
                Rider Information
              </h4>
              {!showRiderSelectionDropdown && nearestRiderInfo.rider && (
                <p className="text-sm">
                  <strong className="text-gray-600">
                    Assigned Rider (Nearest):
                  </strong>{" "}
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
                        Note: This rider is further away, arrival may take
                        longer.
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
              {riders.length === 0 &&
                !isPriceConfigLoading && ( // Only show if not still loading price config which might affect rider list indirectly if needed
                  <p className="text-sm text-red-600">
                    No riders currently available.
                  </p>
                )}
            </div>

            <div className="text-sm text-gray-500 mb-3">Packages:</div>
            <div className="space-y-2 mb-4 flex-grow overflow-y-auto max-h-[30vh]">
              {packages.map((pkg, i) => (
                <div
                  key={i}
                  className="border border-gray-200 p-3 rounded-lg bg-gray-50 text-xs"
                >
                  <p className="font-semibold text-gray-700">
                    Package #{i + 1}
                  </p>
                  <p>
                    <strong className="text-gray-600">Pickup:</strong>{" "}
                    {pkg.pickup?.text || "N/A"}
                  </p>
                  <p>
                    <strong className="text-gray-600">Drop-off:</strong>{" "}
                    {pkg.dropoff?.text || "N/A"}
                  </p>
                  <p>
                    <strong className="text-gray-600">Qty:</strong>{" "}
                    {pkg.quantity}{" "}
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
                    riders.length > 0) || // If dropdown shown, a selection is needed unless no riders at all
                  (riders.length === 0 && !isPriceConfigLoading) || // No riders and not still loading something essential
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
      )}
    </div>
  );
}
