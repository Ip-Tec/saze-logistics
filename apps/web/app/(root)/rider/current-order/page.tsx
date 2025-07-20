// apps/web/components/rider/RiderCurrentOrderPage.tsx
"use client";

import { toast, ToastContainer } from "react-toastify";
import { Database } from "@shared/supabase/types";
import { supabase } from "@shared/supabaseClient";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import GlassButton from "@/components/ui/GlassButton";
import { useAuthContext } from "@/context/AuthContext";
import {
  MapPin,
  User,
  Phone,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { AddressDetail, LatLng } from "@/app/(root)/user/page";
import { formatNaira } from "@/hooks/useNairaFormatter";

// Import the new map component
import RiderMap from "@/components/rider/RiderMap";

// --- Type Definitions for Logistics ---

// Define the structure of the `notes` JSON for an order_item (package)
interface PackageNotes {
  pickup_address: string;
  pickup_coords: LatLng;
  dropoff_address: string;
  dropoff_coords: LatLng;
  item_description: string;
}

// Define the type for an OrderItem object *after* parsing its notes
type LogisticsOrderItem = Omit<
  Database["public"]["Tables"]["order_item"]["Row"],
  "menu_item_id" | "notes"
> & {
  package_details: PackageNotes | null; // Parsed notes
};

// Define the type for the Order object *after* processing (flattening arrays and extracting nested data)
// Explicitly listing only the fields fetched from the 'order' table directly.
type ProcessedOrder = {
  id: string;
  total_amount: number;
  status: string | null;
  special_instructions: string | null;
  created_at: string | null;

  // Relationships from other tables, which are flattened
  user_id: { name: string | null; phone: string | null } | null; // Customer info (from profiles table)
  delivery_address_id:
    | Database["public"]["Tables"]["delivery_address"]["Row"]
    | null; // Primary dropoff address (from delivery_address table)

  // Processed order_item array with parsed notes
  order_item: LogisticsOrderItem[] | null;
};

// Define possible order statuses for a rider's active order
const ACTIVE_RIDER_STATUSES = [
  "pending_confirmation",
  "assigned",
  "picked_up",
  "delivering",
];
const FINAL_RIDER_STATUS = "delivered"; // Status after rider completes delivery

export default function RiderCurrentOrderPage() {
  const { user } = useAuthContext();

  const [currentOrder, setCurrentOrder] = useState<ProcessedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // New states for rider's current location and route display preference
  const [riderCurrentLocation, setRiderCurrentLocation] =
    useState<LatLng | null>(null);
  const [showRouteFromRider, setShowRouteFromRider] = useState(false); // Controls map origin

  // --- Data Fetching ---
  const fetchCurrentOrder = useCallback(async () => {
    if (!user) {
      setError("User not logged in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Fetch order details including related data for customer, delivery address, and order items.
    // Explicitly selecting necessary fields.
    const { data, error: fetchError } = await supabase
      .from("order")
      .select(
        `
          id,
          total_amount,
          status,
          special_instructions,
          created_at,
          user_id (name, phone),
          delivery_address_id (*),
          order_item (id, quantity, price, notes, order_id)
        `
      )
      .eq("rider_id", user.id)
      .in("status", ACTIVE_RIDER_STATUSES)
      .limit(1); // Assuming a rider should only have one active order

    if (fetchError) {
      console.error("Error fetching current order:", fetchError);
      setError("Failed to load current order.");
      setCurrentOrder(null);
    } else {
      if (data && data.length > 0) {
        const order = data[0];

        // Process relationships and parse JSON notes for order items
        const processedOrder: ProcessedOrder = {
          id: order.id,
          total_amount: order.total_amount,
          status: order.status,
          special_instructions: order.special_instructions,
          created_at: order.created_at,
          user_id: Array.isArray(order.user_id)
            ? order.user_id[0] || null
            : order.user_id || null,
          delivery_address_id: Array.isArray(order.delivery_address_id)
            ? order.delivery_address_id[0] || null
            : order.delivery_address_id || null,
          order_item:
            order.order_item?.map((item: any) => {
              let package_details: PackageNotes | null = null;
              if (item.notes && typeof item.notes === "string") {
                try {
                  package_details = JSON.parse(item.notes) as PackageNotes;
                } catch (e) {
                  console.error("Failed to parse order_item notes:", e);
                }
              }
              return {
                ...item, // Keep other order_item fields like id, quantity, price, order_id
                package_details,
              };
            }) || null,
        };
        setCurrentOrder(processedOrder);
      } else {
        setCurrentOrder(null); // No active order found
      }
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCurrentOrder();

    // Get rider's initial live location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRiderCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.warn("Error getting rider's location:", err);
          toast.warn("Could not get your current location for routing.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    // Set up real-time subscription for the rider's orders
    const activeOrdersChannel = supabase
      .channel(`rider_orders_${user?.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "order",
          // Filter to only changes relevant to this rider and active orders
          filter: `rider_id=eq.${user?.id},status=in.(${ACTIVE_RIDER_STATUSES.join(",")})`,
        },
        (payload) => {
          console.log("Real-time change received for rider order:", payload);
          // Refetch to get the latest state of the order, including any new assignments or status changes
          fetchCurrentOrder();
        }
      )
      .subscribe();

    // Cleanup the channel when the component unmounts or user changes
    return () => {
      supabase.removeChannel(activeOrdersChannel);
    };
  }, [user, fetchCurrentOrder]);

  // --- Status Update Logic ---
  const handleStatusUpdate = async (newStatus: string) => {
    if (!currentOrder) return;

    setIsUpdatingStatus(true);
    setError(null);

    try {
      // Update the order status in Supabase directly
      const { data, error: updateError } = await supabase
        .from("order")
        .update({ status: newStatus })
        .eq("id", currentOrder.id)
        .eq("rider_id", user?.id) // Crucial for RLS: ensure only this rider can update their assigned order
        .select() // Select the updated row to get fresh data
        .single(); // Expecting a single row to be updated

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast.success(`Order status updated to ${newStatus.replace(/_/g, " ")}.`);
      // Optimistically update the local state with the new status
      setCurrentOrder((prev) => (prev ? { ...prev, status: newStatus } : null));

      // If the order is delivered, clear the current order state from UI
      if (newStatus === FINAL_RIDER_STATUS) {
        setCurrentOrder(null);
        toast.info("Order completed!");
      }
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      toast.error(err.message || "Failed to update order status.");
      setError("Failed to update order status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Extract primary pickup and dropoff coordinates for the map
  // Assumes the first order_item (package) defines the primary route
  const primaryPickupCoords: LatLng | null = useMemo(() => {
    return (
      currentOrder?.order_item?.[0]?.package_details?.pickup_coords || null
    );
  }, [currentOrder]);

  const primaryDropoffCoords: LatLng | null = useMemo(() => {
    return (
      currentOrder?.order_item?.[0]?.package_details?.dropoff_coords || null
    );
  }, [currentOrder]);

  // --- Render ---
  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center h-screen">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-gray-700">Loading current order...</p>
      </div>
    );
  }

  if (error && !currentOrder) {
    return (
      <div className="text-orange-500 text-center mt-8 p-4">
        <p>{error}</p>
        <p>Please try again later or ensure you are logged in.</p>
        <Link
          href="/auth/login"
          className="text-blue-600 hover:underline mt-4 block"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="text-gray-700 text-center flex flex-col w-full h-screen justify-center items-center p-4">
        <p className="text-2xl font-semibold">
          You do not have a current order assigned.
        </p>
        <p className="text-md mt-2">
          Stay tuned! New delivery requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-8 text-gray-800 overflow-y-auto glass-scrollbar flex flex-col">
      <ToastContainer position="top-right" className={"!z-[999]"}  />

      <h1 className="text-2xl font-bold mb-6">Current Delivery</h1>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Map Section (Mobile first: placed before order details) */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/20 shadow-lg backdrop-blur bg-white/30 h-[400px] lg:h-auto">
          {primaryPickupCoords && primaryDropoffCoords ? (
            <>
              {/* Button to toggle route origin */}
              {riderCurrentLocation && (
                <div className="p-4 bg-white/40 border-b border-white/20">
                  <GlassButton
                    onClick={() => setShowRouteFromRider((prev) => !prev)}
                    disabled={isUpdatingStatus}
                    className="w-full !bg-blue-600 hover:!bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <MapPin size={18} />
                    {showRouteFromRider
                      ? "Show Route: Pickup to Drop-off"
                      : "Show Route: From My Location"}
                  </GlassButton>
                </div>
              )}
              <div className="flex-1 min-h-[300px]">
                <RiderMap
                  pickupCoords={primaryPickupCoords}
                  dropoffCoords={primaryDropoffCoords}
                  riderLocation={riderCurrentLocation}
                  showRouteFromRider={showRouteFromRider}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 p-4">
              No full route information available for the map.
            </div>
          )}
        </div>

        {/* Order Details (Mobile second, Desktop first due to flex-row and inherent order) */}
        <div className="flex-1 backdrop-blur bg-white/30 rounded-2xl p-6 border border-white/20 shadow-lg min-w-[300px]">
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <Package size={18} /> Order ID: #{currentOrder.id.substring(0, 8)}
            </h2>
            <p
              className={`text-sm capitalize ${
                currentOrder.status === "assigned"
                  ? "text-blue-800"
                  : currentOrder.status === "picked_up"
                    ? "text-yellow-800"
                    : currentOrder.status === "delivering"
                      ? "text-green-800"
                      : "text-gray-600"
              }`}
            >
              Status: {currentOrder.status?.replace(/_/g, " ") || "N/A"}
            </p>
            {currentOrder.created_at && (
              <p className="text-xs text-gray-600 mt-1">
                Ordered: {new Date(currentOrder.created_at).toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-4 text-sm">
            {/* Customer Info */}
            <div className="flex items-center gap-3">
              <User size={18} />
              <span>{currentOrder.user_id?.name || "N/A"}</span>
              {currentOrder.user_id?.phone && (
                <a
                  href={`tel:${currentOrder.user_id.phone}`}
                  className="ml-auto"
                >
                  <GlassButton className="!text-blue-500 hover:!bg-blue-100/60 hover:border-blue-500 cursor-pointer rounded-md p-1">
                    <Phone size={16} />
                  </GlassButton>
                </a>
              )}
            </div>

            {/* Package Details (List of Items with their pickup/dropoff) */}
            <div className="flex items-start gap-3">
              <Package size={18} />
              <div className="flex flex-col flex-1">
                <span className="font-semibold">Packages:</span>
                {currentOrder.order_item &&
                currentOrder.order_item.length > 0 ? (
                  <ul className="list-disc pl-5 text-gray-700">
                    {currentOrder.order_item.map((item, idx) => (
                      <li key={item.id || idx} className="mb-2">
                        <p className="font-medium">
                          Package #{idx + 1}:{" "}
                          {item.package_details?.item_description ||
                            "Generic Item"}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">From:</span>{" "}
                          {item.package_details?.pickup_address || "N/A"}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">To:</span>{" "}
                          {item.package_details?.dropoff_address || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600">
                    No package details available.
                  </span>
                )}
              </div>
            </div>

            {/* Total Amount */}
            <div className="flex items-center gap-3">
              <span className="font-semibold">Amount:</span>
              <span className="text-green-700 font-bold text-lg">
                {formatNaira(currentOrder.total_amount) || "0.00"}
              </span>
            </div>

            {/* Special Instructions */}
            {currentOrder.special_instructions && (
              <div className="flex items-start gap-3">
                <span className="font-semibold">Instructions:</span>
                <span className="text-gray-600 italic flex-1">
                  {currentOrder.special_instructions}
                </span>
              </div>
            )}
          </div>

          {/* Rider Actions (Status Update Buttons) */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            {currentOrder.status === "pending_confirmation" && (
              <GlassButton
                onClick={() => handleStatusUpdate("assigned")} // Rider accepts the order
                disabled={isUpdatingStatus}
                className="flex-1 !bg-green-500 hover:!bg-green-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isUpdatingStatus ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Accept Order
              </GlassButton>
            )}

            {currentOrder.status === "assigned" && (
              <GlassButton
                onClick={() => handleStatusUpdate("picked_up")}
                disabled={isUpdatingStatus}
                className="flex-1 !bg-yellow-500 hover:!bg-yellow-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isUpdatingStatus ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Package size={18} />
                )}
                Mark as Picked Up
              </GlassButton>
            )}

            {currentOrder.status === "picked_up" && (
              <GlassButton
                onClick={() => handleStatusUpdate("delivering")}
                disabled={isUpdatingStatus}
                className="flex-1 !bg-blue-500 hover:!bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isUpdatingStatus ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MapPin size={18} />
                )}
                Mark as Delivering
              </GlassButton>
            )}

            {currentOrder.status === "delivering" && (
              <GlassButton
                onClick={() => handleStatusUpdate("delivered")}
                disabled={isUpdatingStatus}
                className="flex-1 !bg-green-500 hover:!bg-green-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isUpdatingStatus ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Mark as Delivered
              </GlassButton>
            )}

            {/* Report Issue Button - Always available for active orders */}
            {currentOrder.status !== FINAL_RIDER_STATUS && (
              <GlassButton
                onClick={() =>
                  toast.info(
                    "Report Issue functionality needs to be implemented."
                  )
                }
                disabled={isUpdatingStatus}
                className="flex-1 !bg-red-500 hover:!bg-red-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                <XCircle size={18} /> Report Issue
              </GlassButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
