// apps/web/components/vendor/VendorOrders.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Database } from "@shared/supabase/types";
import { supabase } from "@shared/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";

// Import your UI components
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";
import GlassDivClickable from "@/components/ui/GlassDivClickable";
import { Loader2 } from "lucide-react"; // For loading indicator

// --- Type Definitions ---

// Define possible order statuses for each tab
const VENDOR_STATUSES = {
  incoming: ["pending"], // Orders placed but not yet accepted by vendor
  current: [
    "accepted",
    "preparing",
    "ready",
    "assigned",
    "picked_up",
    "delivering",
  ], // Orders accepted and in progress
  completed: ["delivered", "cancelled", "rejected"], // Orders finished or cancelled
};

// Define the type for an Order object *directly* from the Supabase query result
// This type explicitly matches the structure returned by your `.select()` query.
type VendorOrderQueryResult = {
  id: string;
  total_amount: number;
  status: string | null;
  special_instructions: string | null;
  created_at: string | null;
  updated_at: string | null;

  // Relationships selected as arrays
  user_id: { name: string | null; phone: string | null }[] | null; // Customer profile relationship
  delivery_address_id:
    | Database["public"]["Tables"]["delivery_address"]["Row"][]
    | null; // Delivery address relationship

  // order_item relationship - array of items
  order_item:
    | {
        // Each item in the order_item array
        id: string; // order_item row field
        quantity: number; // order_item row field
        price: number; // order_item row field
        notes: string | null; // order_item row field
        order_id: string | null; // order_item row field
        // Nested menu_item_id relationship within order_item
        menu_item_id: { name: string | null } | null; // This relationship returns an object or null
      }[]
    | null; // The order_item array itself can be null
};

// Define the type for the Order object *after* processing for display
// This type represents the simplified structure used in the component's state.
// We define the shape of the processed item first.
type ProcessedVendorOrderItem = {
  id: string; // Keep item ID for keys
  quantity: number;
  price: number;
  notes: string | null;
  // We don't need order_id here as it's part of the parent order object
  menu_item_name: string | null; // The extracted name from the nested relationship
};

type ProcessedVendorOrder = {
  id: string;
  total_amount: number;
  status: string | null;
  special_instructions: string | null;
  // created_at and updated_at are processed into displayTime

  // Flattened relationships
  customer: { name: string | null; phone: string | null } | null; // Extracted from user_id array
  delivery_address:
    | Database["public"]["Tables"]["delivery_address"]["Row"]
    | null; // Extracted from delivery_address_id array
  items: ProcessedVendorOrderItem[] | null; // Array of processed items

  // Display-friendly fields
  displayTime: string;
  displayStatus: string;
};

// State types for orders data organized by tab
type OrderTabKey = keyof typeof VENDOR_STATUSES; // 'incoming', 'current', 'completed'
type VendorOrdersDataState = {
  [key in OrderTabKey]: ProcessedVendorOrder[];
};

// --- Component ---

const VendorOrders: React.FC = () => {
  const { user } = useAuthContext(); // Get the logged-in user (vendor)
  const [activeTab, setActiveTab] = useState<OrderTabKey>("incoming");
  const [selectedOrder, setSelectedOrder] =
    useState<ProcessedVendorOrder | null>(null); // Track the selected order details
  const [ordersData, setOrdersData] = useState<VendorOrdersDataState>({
    // State for fetched orders
    incoming: [],
    current: [],
    completed: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // For button loading state

  // Helper function to process raw fetched order data into the display format
  // Takes the raw query result item type and returns the processed state type
  const processOrderForDisplay = (
    order: VendorOrderQueryResult
  ): ProcessedVendorOrder => {
    // Get time string (e.g., "X mins ago" or formatted date) - Basic implementation
    const timeString = order.created_at
      ? new Date(order.created_at).toLocaleString() // Simple date format
      : "N/A"; // Or use a library like `date-fns` for "time ago"

    // Get display status string
    const displayStatus = order.status?.replace("_", " ") || "Unknown Status";

    // Process nested items - Map order_item array
    const processedItems: ProcessedVendorOrderItem[] | null =
      order.order_item?.map((item) => ({
        id: item.id, // Keep item's ID
        quantity: item.quantity, // Keep quantity
        price: item.price, // Keep price
        notes: item.notes, // Keep notes
        // Extract item name from the nested menu_item_id object
        menu_item_name: item.menu_item_id?.name ?? null,
      })) ?? null; // Ensure null if order_item array is null

    return {
      id: order.id,
      total_amount: order.total_amount,
      status: order.status,
      special_instructions: order.special_instructions,
      // Flattened relationships
      customer:
        order.user_id && order.user_id.length > 0 ? order.user_id[0] : null,
      delivery_address:
        order.delivery_address_id && order.delivery_address_id.length > 0
          ? order.delivery_address_id[0]
          : null,
      items: processedItems, // Assign the processed items array
      // Display fields
      displayTime: timeString,
      displayStatus: displayStatus,
    };
  };

  // --- Data Fetching ---
  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      // Ensure user and user ID are available
      setError("Vendor not logged in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all orders for this vendor
      // data will be VendorOrderQueryResult[] | null
      const { data, error: fetchError } = await supabase
        .from("order")
        .select(
          `
          id,
          total_amount,
          status,
          special_instructions,
          created_at,
          updated_at,
          user_id (name, phone),
          delivery_address_id (*),
          order_item (id, quantity, price, notes, order_id, menu_item_id (name))
          `
        )
        .eq("vendor_id", user.id) // Filter by the logged-in vendor's ID
        .order("created_at", { ascending: false }); // Order by creation time, newest first

      if (fetchError) {
        console.error("Error fetching vendor orders:", fetchError);
        setError("Failed to load orders.");
        setOrdersData({ incoming: [], current: [], completed: [] }); // Clear data on error
      } else {
        // Data is an array (VendorOrderQueryResult[] | null) or [] if no results
        if (data) {
          // Process the fetched orders array
          const processedOrders = data.map((orderItem) => {
            const typedOrderItem: VendorOrderQueryResult = {
              ...orderItem,
              order_item: orderItem.order_item?.map(item => ({
                ...item,
                menu_item_id: Array.isArray(item.menu_item_id) ? item.menu_item_id[0] : item.menu_item_id
              })) ?? []
            };
            return processOrderForDisplay(typedOrderItem);
          });

          // Filter processed orders into the correct tabs based on status
          const newOrdersData: VendorOrdersDataState = {
            incoming: [],
            current: [],
            completed: [],
          };

          processedOrders.forEach((order) => {
            if (
              order.status &&
              VENDOR_STATUSES.incoming.includes(order.status)
            ) {
              newOrdersData.incoming.push(order);
            } else if (
              order.status &&
              VENDOR_STATUSES.current.includes(order.status)
            ) {
              newOrdersData.current.push(order);
            } else if (
              order.status &&
              VENDOR_STATUSES.completed.includes(order.status)
            ) {
              newOrdersData.completed.push(order);
            }
            // Ignore orders with unexpected statuses
          });

          setOrdersData(newOrdersData);

          // --- Logic to maintain or update selected order ---
          const currentTabOrders = newOrdersData[activeTab];
          if (selectedOrder) {
            // If an order is currently selected, check if it still exists in the *new* data for the *current* tab
            const updatedSelectedOrder = currentTabOrders.find(
              (order) => order.id === selectedOrder.id
            );
            if (updatedSelectedOrder) {
              // If it exists, update the selected order state to have the latest data
              setSelectedOrder(updatedSelectedOrder);
            } else {
              // If the previously selected order is no longer in the current tab (e.g., status changed), deselect it
              setSelectedOrder(null);
              // Optionally auto-select the first order if the tab is not empty
              if (currentTabOrders.length > 0) {
                setSelectedOrder(currentTabOrders[0]);
              }
            }
          } else if (currentTabOrders.length > 0) {
            // If no order was selected and the current tab has orders, auto-select the first one
            setSelectedOrder(currentTabOrders[0]);
          } else {
            // If the current tab is empty, ensure no order is selected
            setSelectedOrder(null);
          }
          // --- End selected order logic ---
        } else {
          // Data is null or empty results array
          setOrdersData({ incoming: [], current: [], completed: [] });
          setSelectedOrder(null); // Deselect if no data
        }
        setError(null); // Clear error on successful fetch (even if no data)
      }
    } catch (err) {
      console.error("An unexpected error occurred during fetch:", err);
      setError("An unexpected error occurred while loading orders.");
      setOrdersData({ incoming: [], current: [], completed: [] });
      setSelectedOrder(null);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }, [user?.id, activeTab]); // Dependencies: user ID, refetch when tab changes. Removed selectedOrder dependency from here to prevent loops.
  // Fetch data when the component mounts or user changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // Effect depends on the fetchOrders callback

  // Optional: Set up Realtime subscription for vendor's orders
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`vendor_orders_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "order",
          filter: `vendor_id=eq.${user.id}`, // Filter for this vendor's orders
        },
        (payload) => {
          console.log("Vendor order change received!", payload);
          // A change occurred, refetch the orders to update the lists
          // A more sophisticated approach would update state directly based on payload
          fetchOrders(); // Simpler approach: just refetch
        }
      )
      .subscribe();

    // Cleanup the subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOrders]); // Re-subscribe if user or fetchOrders changes

  // --- Status Update Actions ---

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    setError(null);
    try {
      // Recommend using an API route for security and business logic
      const response = await fetch("/api/vendor/update-order-status", {
        method: "POST", // Or PATCH
        headers: {
          "Content-Type": "application/json",
          // Add Authorization header if your API route requires it
          // e.g., 'Authorization': `Bearer ${await supabase.auth.getSession()?.then(s => s?.data.session?.access_token)}`
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          vendorId: user?.id,
        }), // Pass vendorId for server-side verification
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          result.message ||
            `Order ${orderId.substring(0, 8)} status updated to ${newStatus}.`
        );
        // After successful update, refetch orders to move the order to the correct tab
        fetchOrders();
        // The selectedOrder will be updated by the fetchOrders logic now
      } else {
        console.error("Failed to update order status:", result.error);
        setError(result.error || "Failed to update order status.");
        toast.error(result.error || "Failed to update order status.");
      }
    } catch (err) {
      console.error("Error calling status update API:", err);
      setError("An unexpected error occurred while updating status.");
      toast.error("An unexpected error occurred while updating status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Placeholder handlers (will call handleStatusUpdate)
  const handleAccept = (orderId: string) =>
    handleStatusUpdate(orderId, "accepted");
  const handleReject = (orderId: string) =>
    handleStatusUpdate(orderId, "rejected");
  const handleMarkReady = (orderId: string) =>
    handleStatusUpdate(orderId, "ready");

  // --- Render Helpers ---

  const renderOrders = (list: ProcessedVendorOrder[]) => {
    if (isLoading) {
      return (
        <div className="flex w-full justify-center items-center p-8">
          <Loader2 size={24} className="animate-spin text-orange-500" />
          <p className="ml-2 text-gray-700">Loading orders...</p>
        </div>
      );
    }

    if (error && list.length === 0) {
      // Only show error if lists are empty
      return (
        <div className="text-orange-500 text-center p-8">
          <p>{error}</p>
          <p>Could not load orders.</p>
        </div>
      );
    }

    if (!list || list.length === 0) {
      return (
        <div className="text-gray-700 text-center p-8">
          <p>No {activeTab} orders found.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-left justify-start gap-4 my-4 pb-36">
        {" "}
        {/* Use flex-col */}
        {list.map((order) => (
          <GlassDivClickable
            key={order.id}
            className={`w-full ${selectedOrder?.id === order.id ? "!border-blue-500 border-2" : ""}`} // Highlight selected order
            onClick={() => setSelectedOrder(order)}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-lg">
                #{order.id.substring(0, 8)}
              </span>{" "}
              {/* Truncate ID */}
              <span className="text-xs text-gray-500">
                {activeTab === "incoming"
                  ? order.displayTime
                  : order.displayStatus}{" "}
                {/* Show time for incoming, status for others */}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              <p>Customer: {order.customer?.name || "N/A"}</p>{" "}
              {/* Use processed customer name */}
              {order.items && order.items.length > 0 && (
                <p>
                  Items:{" "}
                  {order.items
                    .map(
                      (item) =>
                        `${item.quantity}x ${item.menu_item_name || "Unknown"}`
                    )
                    .join(", ")}
                </p>
              )}
              <p>Total: ₦{order.total_amount?.toFixed(2) || "0.00"}</p>{" "}
              {/* Use processed total */}
            </div>
            {activeTab === "incoming" && (
              <div className="flex gap-2 mt-4">
                <GlassButton
                  className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(order.id);
                  }} // Prevent click on parent div
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Accept"
                  )}
                </GlassButton>
                <GlassButton
                  className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(order.id);
                  }} // Prevent click on parent div
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Reject"
                  )}
                </GlassButton>
              </div>
            )}
            {activeTab === "current" &&
              order.status !== "ready" &&
              order.status !== "delivered" &&
              order.status !== "cancelled" &&
              order.status !== "rejected" && ( // Only show "Mark Ready" if in a valid current state
                <div className="mt-4">
                  <GlassButton
                    className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkReady(order.id);
                    }} // Prevent click on parent div
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Mark as Ready"
                    )}
                  </GlassButton>
                </div>
              )}
            {/* Add other buttons/actions for current tab if needed (e.g., contact customer) */}
          </GlassDivClickable>
        ))}
      </div>
    );
  };
  // --- Main Render ---
  return (
    <div className="p-6 w-full h-full flex flex-col">
      {" "}
      {/* Use flex-col for layout */}
      <h1 className="text-2xl font-bold mb-6 text-white">Vendor Orders</h1>
      {/* Tabs */}
      <GlassDiv className="flex space-x-4 mb-4 w-auto self-start">
        {" "}
        {/* self-start to keep tabs left-aligned */}
        {(["incoming", "current", "completed"] as OrderTabKey[]).map((tab) => (
          <GlassButton
            key={tab}
            className={`px-4 py-2 rounded !shadow-none ${activeTab === tab ? "!bg-black text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "incoming"
              ? "Incoming"
              : tab === "current"
                ? "In Progress"
                : "Completed"}
          </GlassButton>
        ))}
      </GlassDiv>
      {/* Orders List and Details Columns */}
      {/* Use flex-1 to make these columns take available space and fill height */}
      <div className="flex flex-1 gap-6 min-h-0">
        {" "}
        {/* min-h-0 crucial for flex items in flex column */}
        {/* Orders Column */}
        {/* Set explicit width and make scrollable */}
        <div className="w-full lg:w-2/3 flex-shrink-0 flex-grow !h-full !overflow-y-scroll glass-scrollbar">
          {" "}
          {/* Added lg:w-2/3 for responsiveness */}
          {renderOrders(ordersData[activeTab])} {/* Use state data */}
        </div>
        {/* Order Details Column */}
        {/* Set explicit width */}
        <div className="hidden lg:block lg:w-1/3 flex-shrink-0 overflow-y-auto glass-scrollbar">
          {" "}
          {/* Hide on small screens, show on large */}
          <GlassDiv className="p-4 rounded-2xl shadow-lg bg-gray-100">
            <h3 className="text-xl font-semibold mb-4">Order Details</h3>
            {selectedOrder ? (
              <div className="space-y-2 text-sm">
                {" "}
                {/* Add some spacing */}
                <p>
                  <span className="font-bold">Order ID:</span> #
                  {selectedOrder.id.substring(0, 8)}
                </p>{" "}
                {/* Truncate ID */}
                <p>
                  <span className="font-medium">Customer:</span>{" "}
                  {selectedOrder.customer?.name || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {selectedOrder.customer?.phone || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {selectedOrder.displayStatus}
                </p>
                <p>
                  <span className="font-medium">Ordered:</span>{" "}
                  {selectedOrder.displayTime}
                </p>{" "}
                {/* Use display time */}
                <p>
                  <span className="font-medium">Total:</span> ₦
                  {selectedOrder.total_amount?.toFixed(2) || "0.00"}
                </p>
                {selectedOrder.special_instructions && (
                  <p>
                    <span className="font-medium">Instructions:</span>{" "}
                    <span className="italic text-gray-600">
                      {selectedOrder.special_instructions}
                    </span>
                  </p>
                )}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <p className="font-medium mt-2 mb-1">Items:</p>
                    <ul className="list-disc pl-5">
                      {selectedOrder.items.map((item) => (
                        <li key={item.id} className="text-gray-700">
                          <span className="font-semibold">
                            {item.quantity}x
                          </span>{" "}
                          {item.menu_item_name || "Unknown Item"} - ₦
                          {item.price?.toFixed(2) || "0.00"} each{" "}
                          {/* Use menu_item_name */}
                          {item.notes && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({item.notes})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedOrder.delivery_address && (
                  <div>
                    <p className="font-medium mt-2 mb-1">Delivery Address:</p>
                    <p className="text-gray-700">
                      {selectedOrder.delivery_address.street}
                      {selectedOrder.delivery_address.city
                        ? ", " + selectedOrder.delivery_address.city
                        : ""}
                      {selectedOrder.delivery_address.state
                        ? ", " + selectedOrder.delivery_address.state
                        : ""}
                      {selectedOrder.delivery_address.country
                        ? ", " + selectedOrder.delivery_address.country
                        : ""}
                    </p>
                    {/* Optional: Link to map for delivery address */}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                Click an order to see its details.
              </p>
            )}
          </GlassDiv>
        </div>
      </div>
    </div>
  );
};

export default VendorOrders;
