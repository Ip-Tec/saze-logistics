// apps/web/components/rider/RiderCurrentOrderPage.tsx
"use client";

import { toast } from "react-toastify";
import { Database } from "@shared/supabase/types";
import { supabase } from "@shared/supabaseClient";
import React, { useEffect, useState } from "react";
import GlassButton from "@/components/ui/GlassButton";
import { useAuthContext } from "@/context/AuthContext";
import {
  MapPin,
  User,
  Phone,
  Package,
  Clock3,
  CheckCircle,
  XCircle,
  Loader2,
  Store,
} from "lucide-react";
import Link from "next/link";

// Define the type for an Order object *directly* from the Supabase query result (before processing)
// Relationships selected as `name (...)` or `*` return arrays of objects/rows.
type OrderQueryResult = {
  id: string;
  total_amount: number;
  status: string | null;
  special_instructions: string | null;
  created_at: string | null;

  // Relationships selected as arrays by Supabase/PostgREST
  user_id: { name: string | null; phone: string | null }[] | null;
  vendor_id:
    | {
        name: string | null;
        phone: string | null;
        address: string | null;
        logo_url: string | null;
      }[]
    | null;
  delivery_address_id:
    | Database["public"]["Tables"]["delivery_address"]["Row"][]
    | null;

  // order_item is an array, and its nested menu_item_id is an object or null
  order_item:
    | (Database["public"]["Tables"]["order_item"]["Row"] & {
        menu_item_id: { name: string | null } | null; // Nested object or null from select('name')
      })[]
    | null;

  // Add other columns if you select them directly on the 'order' table
};

// Define the type for the Order object *after* processing (flattening arrays and extracting nested data)
// This shape matches the state you want to use in the component.
type ProcessedOrderItem = Omit<Database["public"]["Tables"]["order_item"]["Row"], 'menu_item_id'> & {
    menu_item_id: string | null; // Flattened to just the name string or null
};


type ProcessedOrder = Omit<
  OrderQueryResult, // Use the query result type as the base
  "user_id" | "vendor_id" | "delivery_address_id" | "order_item" // Omit original relationship array properties
> & {
  // Flattened relationships (assuming one-to-one or many-to-one conceptually for display)
  user_id: { name: string | null; phone: string | null } | null;
  vendor_id: {
    name: string | null;
    phone: string | null;
    address: string | null;
    logo_url: string | null;
  } | null;
  delivery_address_id:
    | Database["public"]["Tables"]["delivery_address"]["Row"]
    | null;
  // Processed order_item array with flattened menu_item_id
  order_item: ProcessedOrderItem[] | null;
};

// Define possible order statuses for a rider's active order
const ACTIVE_RIDER_STATUSES = ["assigned", "picked_up", "delivering"];
const FINAL_RIDER_STATUS = "delivered"; // Status after rider completes delivery

export default function RiderCurrentOrderPage() {
  const { user } = useAuthContext();

  // Use the ProcessedOrder type for the state
  const [currentOrder, setCurrentOrder] = useState<ProcessedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchCurrentOrder = async () => {
      if (!user) {
        setError("User not logged in.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null); // Clear previous errors

      // Fetch orders assigned to the current rider with an active status.
      // Removing .single() allows for 0 or more results without throwing an error.
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
          vendor_id (name, phone, address, logo_url),
          delivery_address_id (*),
          order_item (id, quantity, price, notes, order_id, menu_item_id (name))
          `
        )
        .eq("rider_id", user.id) // Filter by the logged-in rider's ID
        .in("status", ACTIVE_RIDER_STATUSES); // Filter by active rider statuses
        // REMOVED .single(); // <-- This was causing the errors

      if (fetchError) {
        // If .single() was removed, this block will only be hit for actual API/DB errors,
        // not for the expected "0 rows found" case.
        console.error("Error fetching current order:", fetchError);
        setError("Failed to load current order."); // Set a general error for unexpected fetch errors
        setCurrentOrder(null); // Ensure state is null on error
      } else {
        // Data is now an array (OrderQueryResult[] | null) or [] if no results
        if (data && data.length > 0) {
           // Assuming a rider should only have *one* current order based on app logic.
           // Take the first order from the array.
           const order = data[0];

           // Optional: Log a warning if multiple active orders are found,
           // as this might indicate a data integrity issue in your app.
           if (data.length > 1) {
             console.warn(
               `Warning: Multiple active orders (${data.length}) found for rider ${user.id}. Displaying the first one.`,
               data
             );
             // Optionally, display a user-facing warning or error if multiple is strictly forbidden.
             // setError("Multiple active orders detected. Please contact support.");
           }

          // Process the single order object (the first one found)
          // to flatten the relationship arrays into single objects/values
          const processedData: ProcessedOrder = {
            ...order,
            // Extract the first element from the relationship arrays returned by Supabase
            user_id: order.user_id?.[0] ?? null,
            vendor_id: order.vendor_id?.[0] ?? null,
            delivery_address_id: order.delivery_address_id?.[0] ?? null,
             // Map through order_item array and flatten the nested menu_item_id object
            order_item: order.order_item?.map((item) => ({
              ...item,
              order_id: item.order_id,
              // Extract just the name string from the nested menu_item_id object or use null
              menu_item_id: item.order_id ?? null,
            })) ?? null, // Use null if order_item array itself is null
          };

          setCurrentOrder(processedData);
          setError(null); // Clear any previous errors if data was successfully fetched
        } else {
          // Data is null or an empty array -> No current order found
          setCurrentOrder(null);
          setError(null); // Clear error state - this is the expected outcome when no order is assigned
        }
      }

      setIsLoading(false); // Stop loading regardless of outcome (success or no data)
    };

    // Only fetch if user is available
    if (user) {
      fetchCurrentOrder();
    } else {
      setIsLoading(false); // Stop loading if no user
    }

    // Optional: Set up real-time subscription here if desired,
    // targeting orders assigned to this rider ID and in the active statuses.
    // See Supabase documentation for real-time subscriptions.
    // Example structure (you would need to implement the handleNewOrder function):
    
    const activeOrdersChannel = supabase
      .channel(`rider_orders_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order',
          filter: `rider_id=eq.${user?.id},status=in.(${ACTIVE_RIDER_STATUSES.join(',')})` // Add filter
        },
        (payload) => {
          console.log('Change received!', payload);
          // Implement logic to update state based on changes (e.g., new order assigned, status update by vendor)
          // You might refetch the order or update the state directly based on payload.
          // Be careful with complex updates; refetching might be simpler initially.
          fetchCurrentOrder(); // Simple approach: just refetch
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activeOrdersChannel);
    };
    

  }, [user]); // Re-run effect if user changes  // --- Status Update Logic ---
  const handleStatusUpdate = async (newStatus: string) => {
    if (!currentOrder) return;

    setIsUpdatingStatus(true);
    setError(null); // Clear previous errors

    // Call an API route to update the order status securely on the server
    // This is recommended to enforce business logic and RLS
    // You MUST implement the /api/rider/update-order-status route
    try {
      const response = await fetch("/api/rider/update-order-status", {
        method: "POST", // Or PATCH depending on your API design
        headers: {
          "Content-Type": "application/json",
          // Add Authorization header if your API route requires it
          // e.g., 'Authorization': `Bearer ${await supabase.auth.getSession()?.then(s => s?.data.session?.access_token)}`
        },
        body: JSON.stringify({
          orderId: currentOrder.id,
          status: newStatus,
          riderId: user?.id // Pass riderId to verify on the server
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          result.message || `Order status updated to ${newStatus}.`
        );
        // Update the local state with the new status
        setCurrentOrder((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );

        // If the order is delivered, clear the current order state
        if (newStatus === FINAL_RIDER_STATUS) {
          setCurrentOrder(null);
          toast.info("Order completed!");
        }
      } else {
        console.error("Failed to update order status:", result.error);
        // Set a user-friendly error message
        setError(result.error || "Failed to update order status.");
        toast.error(result.error || "Failed to update order status.");
      }
    } catch (err) {
      console.error("Error calling status update API:", err);
      // Set a user-friendly error message for network or unexpected issues
      setError("An unexpected error occurred while updating status.");
      toast.error("An unexpected error occurred while updating status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Construct the full delivery address string
  const fullAddress = currentOrder?.delivery_address_id
    ? `${currentOrder.delivery_address_id.street}${currentOrder.delivery_address_id.city ? ', ' + currentOrder.delivery_address_id.city : ''}${currentOrder.delivery_address_id.state ? ', ' + currentOrder.delivery_address_id.state : ''}${currentOrder.delivery_address_id.country ? ', ' + currentOrder.delivery_address_id.country : ''}`
    : "N/A";

  // Construct the map query using lat/lng if available, fallback to address string
   const mapQuery =
    currentOrder?.delivery_address_id?.lat &&
    currentOrder?.delivery_address_id?.lng
      ? `${currentOrder.delivery_address_id.lat},${currentOrder.delivery_address_id.lng}`
      : encodeURIComponent(fullAddress); // Encode address string for URL

  // Base URL for Google Maps search link
  // This will open the location in Google Maps app or website
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;


  // --- Render ---
  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center h-screen"> {/* Use h-screen for full page loader */}
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-gray-700">Loading current order...</p>
      </div>
    );
  }

  // Show a general error message if there's an error that isn't just "no order"
  if (error && !currentOrder) {
    return (
      <div className="text-orange-500 text-center mt-8">
        <p>{error}</p>
        <p>Please try again later.</p>
      </div>
    );
  }

  // Show the "no current order" message if not loading and no order is found
  if (!currentOrder) {
    return (
      <div className="text-gray-700 text-center flex w-full h-screen justify-center items-center m-auto">
        <p className="text-2xl">You do not have a current order assigned.</p>
        {/* Optional: Link to available orders page if applicable */}
        {/* <Link href="/rider/available-orders">View available orders</Link> */}
      </div>
    );
  }

  // Render the current order details
  return (
    <div className="w-full h-full p-4 md:p-8 text-gray-800 overflow-y-auto glass-scrollbar">
      <h1 className="text-2xl font-bold mb-6">Current Order</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Order Details */}
        <div className="flex-1 backdrop-blur bg-white/30 rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <Package size={18} /> Order ID: #{currentOrder.id.substring(0, 8)}{" "}
              {/* Display truncated ID */}
            </h2>
            <p
              className={`text-sm capitalize ${
                currentOrder.status === "assigned"
                  ? "text-blue-800"
                  : currentOrder.status === "picked_up"
                    ? "text-yellow-800"
                    : currentOrder.status === "delivering"
                      ? "text-green-800"
                      : "text-gray-600" // Fallback
              }`}
            >
              Status: {currentOrder.status?.replace("_", " ") || "N/A"}{" "}
              {/* Handle null status */}
            </p>
             {currentOrder.created_at && (
              <p className="text-xs text-gray-600 mt-1">
                 Ordered: {new Date(currentOrder.created_at).toLocaleString()} {/* Format date */}
              </p>
            )}
          </div>

          <div className="space-y-4 text-sm">
            {/* Customer Info */}
            <div className="flex items-center gap-3">
              <User size={18} />
              <span>{currentOrder.user_id?.name || "N/A"}</span>
              {/* Optional: Call Customer Button */}
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

            {/* Vendor Info */}
            <div className="flex items-center gap-3">
              <Store size={18} />
              <span>{currentOrder.vendor_id?.name || "N/A"}</span>
              {/* Optional: Call Vendor Button */}
              {currentOrder.vendor_id?.phone && (
                <a
                  href={`tel:${currentOrder.vendor_id.phone}`}
                  className="ml-auto"
                >
                  <GlassButton className="!text-blue-500 hover:!bg-blue-100/60 hover:border-blue-500 cursor-pointer rounded-md p-1">
                    <Phone size={16} />
                  </GlassButton>
                </a>
              )}
            </div>

            {/* Delivery Address */}
            <div className="flex items-start gap-3">
              <MapPin size={18} />
              <span className="flex-1">{fullAddress}</span> {/* Use flex-1 to allow text wrap */}
              {/* Optional: View on Map Button */}
               {fullAddress !== "N/A" && (
                <a
                  href={mapSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto" // ml-auto pushes button to the right
                >
                  <GlassButton className="!text-green-500 hover:!bg-green-100/60 hover:border-green-500 cursor-pointer rounded-md p-1">
                    <MapPin size={16} />
                  </GlassButton>
                </a>
              )}
            </div>

            {/* Package Details (List of Items) */}
            <div className="flex items-start gap-3">
              <Package size={18} />
              <div className="flex flex-col flex-1"> {/* Use flex-1 here too */}
                <span className="font-semibold">Items:</span>
                {currentOrder.order_item &&
                currentOrder.order_item.length > 0 ? (
                  <ul className="list-disc pl-5 text-gray-700">
                    {currentOrder.order_item.map((item) => (
                      <li key={item.id}>
                        <span className="font-semibold">{item.quantity}x</span>{" "}
                        {item.menu_item_id || "Unknown Item"} - ₦{item.price?.toFixed(2) || '0.00'} each {/* Use ₦ for Naira, handle null price */}
                        {item.notes && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({item.notes})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600">No items listed.</span>
                )}
              </div>
            </div>

            {/* Estimated Time - NOTE: This is not in your DB schema, hardcoded in demo */}
            {/* You would need to calculate or fetch this from a logistics service */}
            {/* Keeping the placeholder */}
            <div className="flex items-center gap-3">
              <Clock3 size={18} />
              <span>
                 ETA: {currentOrder.status === "assigned" ? "Calculating..." : "N/A"} {/* Placeholder */}
              </span>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-3">
              <span className="font-semibold">Amount:</span>
              <span className="text-green-700 font-bold text-lg">
                ₦{currentOrder.total_amount?.toFixed(2) || '0.00'} {/* Format amount, handle null */}
              </span>
            </div>

            {/* Special Instructions */}
            {currentOrder.special_instructions && (
              <div className="flex items-start gap-3">
                <span className="font-semibold">Instructions:</span>
                <span className="text-gray-600 italic flex-1"> {/* Use flex-1 */}
                  {currentOrder.special_instructions}
                </span>
              </div>
            )}
          </div>

          {/* Rider Actions (Status Update Buttons) */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            {/* Buttons are conditionally rendered based on current status */}
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

             {/* Report Issue Button */}
            <GlassButton
              onClick={() => alert("Implement Report Issue functionality")} // Replace with actual handler
              disabled={isUpdatingStatus}
              className="flex-1 !bg-red-500 hover:!bg-red-600 text-white font-semibold flex items-center justify-center gap-2"
            >
              <XCircle size={18} /> Report Issue
            </GlassButton>
          </div>
        </div>

        {/* Map Section */}
        {/* Only render map link if delivery address has lat/lng or a parsable address string */}
        {fullAddress !== "N/A" && (
          <div className="flex-1 h-[400px] lg:h-auto rounded-2xl overflow-hidden border border-white/20 shadow-lg backdrop-blur bg-white/30">
            {/* You could embed a map iframe here if you have an API key */}
            {/* For a simple link to open in a new tab: */}
            <a
              href={mapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-full flex items-center justify-center text-blue-600 hover:underline p-4" // Added padding
            >
              View Delivery Location on Map
            </a>
          </div>
        )}
        {/* Show message if no location data for map */}
        {fullAddress === "N/A" && (
          <div className="flex-1 h-[400px] lg:h-auto rounded-2xl flex items-center justify-center border border-white/20 shadow-lg backdrop-blur bg-white/30 text-gray-600 p-4"> {/* Added padding */}
            No delivery address available for map.
          </div>
        )}
      </div>
    </div>
  );
}