// app/(root)/user/orders/[orderId]/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  TruckIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/24/outline"; // Import icons
// import { MapContainer as OrderMapContainer } from "@/components/user/MapContainer";

import { createServerClient } from "@supabase/ssr"; // <--- Correct import
import { type Database } from "@shared/supabase/types";
import OrderDetailsClient from "@/app/(root)/user/orders/[id]/OrderDetailsClient";

// Define a detailed Order type for this page
interface OrderDetail {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  special_instructions: string | null;
  rider: {
    id: string;
    name: string;
    phone_number: string;
    email: string;
    avatar_url: string;
  } | null;
  delivery_address: {
    street: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
  } | null;
  order_item: Array<{
    quantity: number;
    notes: string; // JSON string with pickup/dropoff addresses and description
  }>;
}

export const dynamic = "force-dynamic"; // Ensure this page is always dynamic

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  // const orderId = params.orderId;
  const orderIdParams = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Provide async getAll method as cookieStore is awaited
        async getAll() {
          return cookieStore.getAll();
        },
        // Provide async setAll method
        async setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options); // cookieStore.set is synchronous
            }
          } catch (error) {
            console.error("Error setting cookies in API route:", error);
            // In a Route Handler, setting cookies directly is generally expected to work.
          }
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // You can keep this console.log for debugging
  console.log("Session in UserOrdersPage:", session);

  if (!session) {
    redirect("/auth/login");
  }

  const { data: order, error } = await supabase
    .from("order")
    .select(
      `
      id,
      created_at,
      status,
      total_amount,
      special_instructions,
      rider:rider_id(id, name, phone_number, email, profiles!avatar_url)
      delivery_address:delivery_address_id(street, city, state, country, lat, lng),
      order_item(quantity, notes)
    `
    )
    .eq("id", orderIdParams.orderId)
    .eq("user_id", session.user.id) // Ensure only owner can view
    .single();

  if (error || !order) {
    console.error("Error fetching order details:", error);
    // You might want a custom 404 page or error message
    return (
      <div className="container mx-auto p-4 text-center text-gray-600">
        <p>Order not found or you do not have permission to view it.</p>
        <Link
          href="/user/orders"
          className="mt-4 inline-block bg-orange-600 shadown-md px-4 py-2 text-white hover:underline"
        >
          Back to all orders
        </Link>
      </div>
    );
  }
  console.log({ order });
  // Parse order items to extract addresses and descriptions
  const parsedPackages = order.order_item.map((item) => {
    try {
      const notes = JSON.parse(item.notes || "{}");
      return {
        quantity: item.quantity,
        pickup_address: notes.pickup_address,
        pickup_coords: notes.pickup_coords,
        dropoff_address: notes.dropoff_address,
        dropoff_coords: notes.dropoff_coords,
        description: notes.item_description,
      };
    } catch (e) {
      console.error("Error parsing order item notes for package:", e);
      return {
        quantity: item.quantity,
        pickup_address: "N/A",
        pickup_coords: null,
        dropoff_address: "N/A",
        dropoff_coords: null,
        description: "N/A",
      };
    }
  });

  const isActiveOrder =
    order.status === "processing" || order.status === "out_for_delivery";
  const canMonitorRider = isActiveOrder && order && order.rider?.id;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link
        href="/user/orders"
        className="inline-flex items-center text-orange-600 hover:underline mb-6"
      >
        <ArrowLongRightIcon className="w-5 h-5 rotate-180 mr-2" /> Back to
        Orders
      </Link>

      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 text-center">
        Order Details
      </h1>

      <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4 border-b pb-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            Order #{order.id.substring(0, 8)}
          </h2>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              order.status === "completed"
                ? "bg-green-100 text-green-700"
                : order.status === "cancelled"
                  ? "bg-red-100 text-red-700"
                  : order.status === "pending_confirmation" ||
                      order.status === "processing"
                    ? "bg-blue-100 text-blue-700 animate-pulse"
                    : "bg-gray-100 text-gray-600"
            }`}
          >
            {order.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Order Information
            </h3>
            <p className="text-gray-600 flex items-center mb-1">
              <ClockIcon className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-medium">Placed On:</span>{" "}
              {format(new Date(order.created_at), "MMM dd, yyyy HH:mm")}
            </p>
            <p className="text-gray-600 flex items-center mb-1">
              <CurrencyDollarIcon className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-medium">Total Amount:</span> ₦
              {order.total_amount.toFixed(2)}
            </p>
            {order.special_instructions && (
              <p className="text-gray-600 flex items-start mb-1">
                <span className="font-medium flex-shrink-0 mr-2">
                  Instructions:
                </span>{" "}
                {order.special_instructions}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Delivery Address
            </h3>
            {order.delivery_address ? (
              <p className="text-gray-600 flex items-start">
                <MapPinIcon className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  {order.delivery_address.street}
                  <br />
                  {order.delivery_address.city}, {order.delivery_address.state},{" "}
                  {order.delivery_address.country}
                </span>
              </p>
            ) : (
              <p className="text-gray-600">Address details not available.</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Package Details
          </h3>
          <div className="space-y-4">
            {parsedPackages.map((pkg, index) => (
              <div
                key={index}
                className="border border-gray-200 bg-gray-50 rounded-lg p-4"
              >
                <p className="font-semibold text-gray-700 mb-1">
                  Package {index + 1} ({pkg.quantity} item(s))
                </p>
                <p className="text-sm text-gray-600 pl-2">
                  <span className="font-medium">Pickup:</span>{" "}
                  {pkg.pickup_address}
                </p>
                <p className="text-sm text-gray-600 pl-2">
                  <span className="font-medium">Drop-off:</span>{" "}
                  {pkg.dropoff_address}
                </p>
                {pkg.description && (
                  <p className="text-sm text-gray-600 pl-2">
                    <span className="font-medium">Description:</span>{" "}
                    {pkg.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Rider Information
          </h3>
          {order.rider ? (
            <div className="flex items-center space-x-4">
              {order.rider.avatar_url ? (
                <img
                  src={order.rider.avatar_url}
                  alt={order.rider.name || "Rider"}
                  className="w-16 h-16 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-semibold">
                  {order.rider.name?.charAt(0).toUpperCase() || "R"}
                </div>
              )}
              <div>
                <p className="text-gray-700 font-semibold text-lg">
                  {order.rider.name}
                </p>
                <p className="text-gray-500 text-sm">{order.rider.email}</p>
                {order.rider.phone_number && (
                  <p className="text-gray-500 text-sm">
                    {order.rider.phone_number}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Rider not yet assigned.</p>
          )}
        </div>

        {isActiveOrder && order.rider?.id && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4 justify-center md:justify-start">
            <a
              href={`tel:${order.rider.phone_number}`}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              <PhoneIcon className="w-5 h-5 mr-2" /> Call Rider
            </a>
            {/* For chat, you'd integrate a messaging service or a simple internal chat */}
            <button className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md">
              <ChatBubbleLeftIcon className="w-5 h-5 mr-2" /> Chat with Rider
            </button>
            {canMonitorRider && (
              <Link
                href={`/user/orders/${order.id}/track`}
                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
              >
                <TruckIcon className="w-5 h-5 mr-2" /> Track Rider
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Render the client component for real-time rider tracking map */}
      {canMonitorRider && (
        <OrderDetailsClient
          riderId={order.rider.id}
          initialRiderLat={order.rider.lat} // Assuming you fetch current rider location
          initialRiderLng={order.rider.lng} // on initial load if available
          dropoffCoords={
            order.delivery_address
              ? {
                  lat: order.delivery_address.lat,
                  lng: order.delivery_address.lng,
                }
              : null
          }
          pickupCoords={parsedPackages[0]?.pickup_coords} // Pass first package's pickup
        />
      )}
    </div>
  );
}
