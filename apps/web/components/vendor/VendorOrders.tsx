// apps/web/components/vendor/VendorOrders.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Database } from "@shared/supabase/types";
import { supabase } from "@shared/supabaseClient"; // Keep for Realtime subscription
import { useAuthContext } from "@/context/AuthContext"; // Keep for user ID in Realtime filter

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
  completed: ["delivered", "cancelled", "rejected"],
};

// --- Raw Types matching Supabase Query Result Structure ---
// These types are needed because the API returns data in this raw structure
type RawVendorOrderItemResult =
  Database["public"]["Tables"]["order_item"]["Row"] & {
    menu_item_id: { name: string | null }[] | null;
  };

type RawVendorOrderQueryResult =
  Database["public"]["Tables"]["order"]["Row"] & {
    user_id: { name: string | null; phone: string | null }[] | null;
    delivery_address_id:
      | Database["public"]["Tables"]["delivery_address"]["Row"][]
      | null;
    order_item: RawVendorOrderItemResult[] | null;
  };

// --- Processed Types for Component State ---
// ... (ProcessedVendorOrderItem, ProcessedVendorOrder, VendorOrdersDataState remain the same) ...
type ProcessedVendorOrderItem = {
  id: string;
  quantity: number;
  price: number;
  notes: string | null;
  menu_item_name: string | null;
};

type ProcessedVendorOrder = {
  id: string;
  total_amount: number;
  status: string | null;
  special_instructions: string | null;
  customer: { name: string | null; phone: string | null } | null;
  delivery_address:
    | Database["public"]["Tables"]["delivery_address"]["Row"]
    | null;
  items: ProcessedVendorOrderItem[] | null;
  displayTime: string;
  displayStatus: string;
};

type OrderTabKey = keyof typeof VENDOR_STATUSES;
type VendorOrdersDataState = {
  [key in OrderTabKey]: ProcessedVendorOrder[];
};

// --- Component ---

const VendorOrders: React.FC = () => {
  // useAuthContext is still needed for the Realtime subscription filter (user?.id)
  // The API route handles auth for the data fetch itself.
  const { user } = useAuthContext();

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

  // Helper function to process raw fetched order data (now received from API)
  const processOrderForDisplay = (
    order: RawVendorOrderQueryResult // Accept the raw type matching the API result
  ): ProcessedVendorOrder => {
    const timeString = order.created_at
      ? new Date(order.created_at).toLocaleString()
      : "N/A";
    const displayStatus = order.status?.replace("_", " ") || "Unknown Status";

    const processedItems: ProcessedVendorOrderItem[] | null =
      order.order_item?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
        menu_item_name:
          item.menu_item_id && item.menu_item_id.length > 0
            ? (item.menu_item_id[0]?.name ?? null)
            : null,
      })) ?? null;

    const customer =
      order.user_id && order.user_id.length > 0 ? order.user_id[0] : null;
    const deliveryAddress =
      order.delivery_address_id && order.delivery_address_id.length > 0
        ? order.delivery_address_id[0]
        : null;

    return {
      id: order.id,
      total_amount: order.total_amount,
      status: order.status,
      special_instructions: order.special_instructions,
      customer: customer,
      delivery_address: deliveryAddress,
      items: processedItems,
      displayTime: timeString,
      displayStatus: displayStatus,
    };
  };

  // --- Data Fetching (Now calls API) ---
  const fetchOrders = useCallback(async () => {
    // We no longer perform the Supabase query directly here.
    // Authentication and filtering are handled by the API route.
    // This component just needs to *try* and fetch the data.

    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      // Call the new API route to fetch vendor orders
      // Ensure the path matches your API route file (e.g., /api/vendor/orders)
      const response = await fetch("/api/order/v/");

      // Check if the API request was successful
      if (!response.ok) {
        // Read the error message from the API's JSON response
        const errorResult = await response.json();
        console.error("API fetch error:", errorResult);
        // Throw an error with the message received from the API
        throw new Error(
          errorResult.message || `API returned status ${response.status}`
        );
      }

      // Parse the JSON data from the successful API response
      // We expect an array matching the RawVendorOrderQueryResult structure
      const data: RawVendorOrderQueryResult[] = await response.json();

      console.log("Fetched vendor orders from API:", { data });

      // Process the fetched orders array using the function that accepts the raw type
      const processedOrders: ProcessedVendorOrder[] = data.map(
        processOrderForDisplay
      );

      // Filter processed orders into the correct tabs based on status
      const newOrdersData: VendorOrdersDataState = {
        incoming: [],
        current: [],
        completed: [],
      };

      processedOrders.forEach((order) => {
        if (order.status && VENDOR_STATUSES.incoming.includes(order.status)) {
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
      });

      setOrdersData(newOrdersData);

      // --- Logic to maintain or update selected order ---
      // Find the selected order based on the *new* data for the *current* tab
      const updatedSelectedOrder = newOrdersData[activeTab].find(
        (order) => selectedOrder && order.id === selectedOrder.id
      );

      if (updatedSelectedOrder) {
        // If the previously selected order is still in the current tab, update its data
        setSelectedOrder(updatedSelectedOrder);
      } else {
        // If the previously selected order is NOT in the current tab (or was null),
        // try to select the first one in the current tab.
        const firstOrderInNewTab =
          newOrdersData[activeTab].length > 0
            ? newOrdersData[activeTab][0]
            : null;
        setSelectedOrder(firstOrderInNewTab);
      }
      // --- End selected order logic ---

      setError(null); // Clear error on successful fetch
    } catch (err: any) {
      // Handle errors that occurred during the fetch or JSON parsing
      console.error("An unexpected error occurred during API fetch:", err);
      const errorMessage = err.message || "An unexpected error occurred.";
      setError(`Failed to load orders: ${errorMessage}`);
      setOrdersData({ incoming: [], current: [], completed: [] }); // Clear data on error
      setSelectedOrder(null); // Deselect on error
      toast.error(`Failed to load orders: ${errorMessage}`); // Show toast
    } finally {
      setIsLoading(false); // Stop loading
    }
  }, [activeTab, selectedOrder?.id]); // Dependencies: activeTab (when tab changes), selectedOrder.id (to update details if selected order moves tab)
  // Note: user is NOT a dependency here because the API route handles the user check server-side

  // Fetch data when the component mounts and whenever the fetchOrders callback changes
  // The fetchOrders callback now changes when activeTab or selectedOrder?.id changes.
  useEffect(() => {
    // We no longer need the user check here to decide *if* to fetch,
    // the API route will handle if the user is authorized.
    // Just call fetchOrders to initiate the data load.
    fetchOrders();
  }, [fetchOrders]); // Effect depends on the fetchOrders callback

  // Realtime subscription remains client-side, uses the client-side supabase instance
  // This still requires the user ID to filter events for this specific vendor.
  useEffect(() => {
    // Ensure user is available before attempting to subscribe
    if (!user?.id) {
      console.warn(
        "Realtime subscription skipped: User ID not available for filter."
      );
      return; // Do not subscribe if user ID is missing
    }

    console.log("Attempting Realtime subscription for vendor:", user.id);

    const channel = supabase
      .channel(`vendor_orders_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "order",
          filter: `vendor_id=eq.${user.id}`, // Still filter client-side using the user ID from AuthContext
        },
        (payload) => {
          console.log("Vendor order change received via Realtime!", payload);
          // A change occurred, trigger a refetch via the API to update the lists
          // This keeps the data fresh after DB changes initiated elsewhere (e.g., by customer app)
          fetchOrders();
        }
      )
      .subscribe();

    // Cleanup the subscription on component unmount or when user ID changes
    return () => {
      console.log("Unsubscribing from Realtime channel.");
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOrders]); // Re-subscribe if user.id changes or fetchOrders callback changes

  // --- Status Update Actions ---
  // This function already correctly calls the /api/vendor/update-order-status route.
  // No change needed here.
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    // Error for status update is handled within the try/catch block

    try {
      // Call the API route for updating status
      // Ensure the path matches your status update API route
      const response = await fetch("/api/vendor/update-order-status", {
        method: "POST", // Or PATCH, depends on your API
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          // Do NOT send vendorId from the client here for security.
          // The API route /api/vendor/update-order-status must get the vendor ID
          // from the authenticated session server-side to authorize the update.
          // vendorId: user?.id, // <-- Make sure this is commented out or removed
        }),
      });

      // Check if the API request for status update was successful
      if (!response.ok) {
        // Read the error message from the API's JSON response
        const errorResult = await response.json();
        console.error("Status update API error:", errorResult);
        // Throw an error with the message received from the API
        throw new Error(
          errorResult.message ||
            `Status update API returned status ${response.status}`
        );
      }

      // Status update successful
      const result = await response.json(); // API might return a success message

      toast.success(
        result.message ||
          `Order ${orderId.substring(0, 8)} status updated to ${newStatus.replace("_", " ")}.`
      );

      // Refetch orders after successful update to refresh the list and potentially move the order to a different tab
      // fetchOrders is called here and will also update the selected order based on the new data
      fetchOrders();
    } catch (err: any) {
      // Handle errors that occurred during the API call for status update
      console.error("Error calling status update API:", err);
      const errorMsg =
        err.message || "An unexpected error occurred while updating status.";
      setError(errorMsg); // Set error state for status update
      toast.error(errorMsg); // Show toast
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Placeholder handlers remain the same, they just call handleStatusUpdate
  const handleAccept = (orderId: string) =>
    handleStatusUpdate(orderId, "accepted");
  const handleReject = (orderId: string) =>
    handleStatusUpdate(orderId, "rejected");
  const handleMarkReady = (orderId: string) =>
    handleStatusUpdate(orderId, "ready");

  // --- Render Helpers ---
  // ... (renderOrdersList remains the same, it just uses the data from ordersData state) ...
  const renderOrdersList = (list: ProcessedVendorOrder[]) => {
    if (error && list.length === 0 && !isLoading) {
      return (
        <div className="text-red-600 text-center p-8">
          <p>{error}</p>
          <p>Could not load orders.</p>
        </div>
      );
    }

    if (!isLoading && (!list || list.length === 0)) {
      return (
        <div className="text-gray-700 text-center p-8">
          <p>No {activeTab} orders found.</p>
        </div>
      );
    }

    if (isLoading || (error && list.length === 0)) {
      return null; // Don't render list if main loading or error state is active
    }

    return (
      <div className="flex flex-col items-left justify-start gap-4 my-4 pb-36">
        {list.map((order) => (
          <GlassDivClickable
            key={order.id}
            className={`w-full ${selectedOrder?.id === order.id ? "!border-blue-500 border-2" : ""}`}
            onClick={() => setSelectedOrder(order)}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-lg text-black">
                #{order.id.substring(0, 8)}
              </span>
              <span className="text-xs text-gray-500">
                {activeTab === "incoming"
                  ? order.displayTime
                  : order.displayStatus}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              <p>Customer: {order.customer?.name || "N/A"}</p>
              {order.items && order.items.length > 0 && (
                <p>
                  Items:
                  {order.items
                    .map(
                      (item) =>
                        `${item.quantity}x ${item.menu_item_name || "Unknown"}`
                    )
                    .join(", ")}
                </p>
              )}
              <p>Total: ₦{order.total_amount?.toFixed(2) || "0.00"}</p>{" "}
              {/* Use order.total_amount here */}
            </div>

            {activeTab === "incoming" && (
              <div className="flex gap-2 mt-4">
                <GlassButton
                  className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(order.id);
                  }}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Accept"
                  )}
                </GlassButton>
                <GlassButton
                  className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(order.id);
                  }}
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

            {/* Show Mark Ready in list only if status is accepted */}
            {activeTab === "current" && order.status === "accepted" && (
              <div className="mt-4">
                <GlassButton
                  className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkReady(order.id);
                  }}
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
          </GlassDivClickable>
        ))}
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="p-6 w-full h-full flex flex-col text-gray-800">
      {/* Full component loading state */}
      {isLoading ? (
        <div className="flex flex-1 justify-center items-center">
          <Loader2 size={32} className="animate-spin text-orange-500" />
          <p className="ml-2 text-gray-700">Loading orders...</p>
        </div>
      ) : (
        // Main content when not loading
        <>
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Vendor Orders
          </h1>
          {/* Tabs */}
          <GlassDiv className="flex space-x-4 mb-4 w-auto self-start">
            {(["incoming", "current", "completed"] as OrderTabKey[]).map(
              (tab) => (
                <GlassButton
                  key={tab}
                  className={`px-4 py-2 text-black rounded !shadow-none ${activeTab === tab ? "!bg-black hover:!text-gray-300" : "!bg-gray-200 !text-gray-700"}`}
                  onClick={() => setActiveTab(tab)}
                  disabled={isUpdatingStatus} // Disable tab switching while updating status
                >
                  {tab === "incoming"
                    ? `Incoming (${ordersData.incoming.length})`
                    : tab === "current"
                      ? `In Progress (${ordersData.current.length})`
                      : `Completed (${ordersData.completed.length})`}
                </GlassButton>
              )
            )}
          </GlassDiv>
          {/* Orders List and Details Columns */}
          <div className="flex flex-1 gap-6 min-h-0">
            {/* Orders Column */}
            <div className="w-full lg:w-2/3 flex-shrink-0 flex-grow !h-full !overflow-y-scroll glass-scrollbar">
              {renderOrdersList(ordersData[activeTab])}
            </div>
            {/* Order Details Column */}
            <div className="hidden lg:block lg:w-1/3 flex-shrink-0 overflow-y-auto glass-scrollbar">
              <GlassDiv className="p-4 rounded-2xl shadow-lg bg-gray-100 h-full">
                <h3 className="text-xl font-semibold mb-4 text-black">
                  Order Details
                </h3>
                {selectedOrder ? (
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-bold">Order ID:</span> #
                      {selectedOrder.id.substring(0, 8)}
                    </p>
                    <p>
                      <span className="font-medium">Customer:</span>
                      {selectedOrder.customer?.name || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>
                      {selectedOrder.customer?.phone || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>
                      {selectedOrder.displayStatus}
                    </p>
                    <p>
                      <span className="font-medium">Ordered:</span>
                      {selectedOrder.displayTime}
                    </p>
                    <p>
                      <span className="font-medium">Total:</span> ₦
                      {selectedOrder.total_amount?.toFixed(2) || "0.00"}
                    </p>
                    {selectedOrder.special_instructions && (
                      <p>
                        <span className="font-medium">Instructions:</span>
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
                              </span>
                              {item.menu_item_name || "Unknown Item"} - ₦
                              {item.price?.toFixed(2) || "0.00"} each
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
                        <p className="font-medium mt-2 mb-1">
                          Delivery Address:
                        </p>
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
                      </div>
                    )}
                    {selectedOrder.status === "pending" && (
                      <div className="flex gap-2 mt-4">
                        <GlassButton
                          onClick={() => handleAccept(selectedOrder.id)}
                          className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          disabled={isUpdatingStatus}
                        >
                          {isUpdatingStatus ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            "Accept"
                          )}
                        </GlassButton>
                        <GlassButton
                          onClick={() => handleReject(selectedOrder.id)}
                          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
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
                    {selectedOrder.status === "accepted" && (
                      <div className="mt-4">
                        <GlassButton
                          onClick={() => handleMarkReady(selectedOrder.id)}
                          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
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
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Click an order to see its details.
                  </p>
                )}
              </GlassDiv>
            </div>
          </div>
        </>
      )}

      {!isLoading && error && ordersData[activeTab].length === 0 && (
        <div className="w-full text-red-600 text-center mt-4">{error}</div>
      )}
    </div>
  );
};

export default VendorOrders;
