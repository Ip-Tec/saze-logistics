// app/(root)/user/orders/[orderId]/track/page.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLongRightIcon } from "@heroicons/react/24/outline";

import { type Database } from "@shared/supabase/types";
import RiderTrackingMapClient from "@/app/(root)/user/orders/[id]/track/RiderTrackingMapClient"; // New client component for map

export interface LatLng {
  lat: number;
  lng: number;
}

export const dynamic = "force-dynamic"; // Ensure this page is always dynamic

export default async function RiderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const trackingId = await params;
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Fetch initial order details to get rider_id and delivery/pickup coords
  const { data: order, error } = await supabase
    .from("order")
    .select(
      `
      id,
      status,
      rider:profiles!order_rider_id_fkey(id, name, email, phone, rider_image_url),
      delivery_address(street, city, state, country, lat, lng),
      order_item(quantity, notes)
    `
    )
    .eq("id", trackingId.orderId)
    .eq("user_id", session.user.id)
    .single();

  if (error || !order) {
    console.error("Error fetching order for tracking:", error);
    return (
      <div className="container mx-auto p-4 text-center text-red-600">
        <p>Order not found or tracking not available.</p>
        <Link
          href={`/user/orders/${trackingId.orderId}`}
          className="mt-4 inline-block text-orange-600 hover:underline"
        >
          Back to Order Details
        </Link>
      </div>
    );
  }

  if (
    !order.rider?.id ||
    (order.status !== "processing" && order.status !== "out_for_delivery")
  ) {
    return (
      <div className="container mx-auto p-4 text-center text-blue-600">
        <p className="text-xl mb-4">
          Rider tracking is currently not available for this order.
        </p>
        <p className="text-gray-600">
          The order status is "
          {(order.status ?? "").toUpperCase().replace(/_/g, " ")}" or a rider
          has not been assigned yet.
        </p>
        <Link
          href={`/user/orders/${trackingId.orderId}`}
          className="mt-4 inline-flex items-center text-orange-600 hover:underline"
        >
          <ArrowLongRightIcon className="w-5 h-5 rotate-180 mr-2" /> Back to
          Order Details
        </Link>
      </div>
    );
  }

  // Parse first package pickup coords from notes
  let pickupCoords = null;
  try {
    if (order.order_item[0]?.notes) {
      const notes = JSON.parse(order.order_item[0].notes);
      pickupCoords = notes.pickup_coords;
    }
  } catch (e) {
    console.error("Error parsing pickup coords for tracking:", e);
  }

  const dropoffCoords = order.delivery_address
    ? ({
        lat: order.delivery_address.lat,
        lng: order.delivery_address.lng,
      } as LatLng)
    : null;

  // Render the client component for the actual map and real-time logic
  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4 md:p-6 bg-white shadow-md z-10 flex items-center justify-between">
        <Link
          href={`/user/orders/${trackingId.orderId}`}
          className="inline-flex items-center text-orange-600 hover:underline"
        >
          <ArrowLongRightIcon className="w-5 h-5 rotate-180 mr-2" /> Back
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center flex-grow">
          Tracking Order #{trackingId.orderId.substring(0, 8)}
        </h1>
        <div></div> {/* Placeholder for right alignment */}
      </div>
      <RiderTrackingMapClient
        riderId={order.rider.id}
        initialRiderName={order.rider.name || "Your Rider"}
        pickupCoords={pickupCoords}
        dropoffCoords={dropoffCoords}
      />
    </div>
  );
}
