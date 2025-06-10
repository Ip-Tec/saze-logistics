// app/(root)/user/orders/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { formatNaira } from "@/hooks/useNairaFormatter"; 
import {
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

// Import createServerClient from @supabase/ssr for server components
import { createServerClient } from "@supabase/ssr";
import { type Database } from "@shared/supabase/types";

// Define Order type (rest of your type definition is fine)
interface Order {
  id: string;
  created_at: string | null;
  status: string | null;
  total_amount: number;
  rider: {
    id: string;
    name: string;
  } | null;
  delivery_address: {
    street: string;
    city: string;
  } | null;
  order_item: Array<{
    notes: string; // JSON string with pickup/dropoff addresses
  }>;
}

export const dynamic = "force-dynamic";

export default async function UserOrdersPage() {
  // Pass the cookies instance from Next.js headers to createServerClient
  // This tells Supabase client to read the cookies from the incoming request

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
  // console.log("Session in UserOrdersPage:", session);

  if (!session) {
    redirect("/auth/login");
  }

  const { data: orders, error } = await supabase
    .from("order")
    .select(
      `
      id,
      created_at,
      status,
      total_amount,
      rider:rider_id(id, name),
      delivery_address:delivery_address_id(street, city),
      order_item(notes)
    `
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return (
      <div className="container mx-auto p-4 text-center text-red-600">
        <p>Error loading your orders. Please try again later.</p>
      </div>
    );
  }

  const userOrders: Order[] = orders as unknown as Order[];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 text-center">
        Your Deliveries
      </h1>

      {userOrders.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-md mt-10">
          <p className="text-xl text-gray-600">
            You haven't placed any delivery orders yet.
          </p>
          <Link
            href="/user"
            className="mt-4 inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Start a New Delivery
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userOrders.map((order) => {
            const firstPackageNotes = order.order_item[0]?.notes;
            let dropoffLocation = "N/A";
            try {
              if (firstPackageNotes) {
                const parsedNotes = JSON.parse(firstPackageNotes);
                dropoffLocation = parsedNotes.dropoff_address || "N/A";
              }
            } catch (e) {
              console.error("Error parsing order item notes:", e);
            }

            return (
              <a
                key={order.id}
                href={`/user/orders/${order.id}`}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3 border-b pb-3">
                    <h2 className="text-xl font-semibold text-gray-700">
                      Order #{order.id.substring(0, 8)}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order?.status === "delivered"
                          ? "bg-green-300 text-green-700"
                          : order?.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : order?.status === "picked"
                              ? "bg-yellow-100 text-yellow-700"
                            : order?.status === "pending_confirmation" ||
                                order?.status === "processing"
                              ? "bg-blue-100 text-blue-700 animate-pulse"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status?.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-gray-600 flex items-center mb-2">
                    <ClockIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="font-medium">Placed:</span>{" "}
                    {order.created_at
                      ? format(new Date(order.created_at), "MMM dd,PPPP HH:mm")
                      : "N/A"}
                  </p>
                  <p className="text-gray-600 flex items-center mb-2">
                    <MapPinIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="font-medium">Drop-off:</span>{" "}
                    {dropoffLocation}
                  </p>
                  <p className="text-gray-600 flex items-center mb-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="font-medium">Total:</span>
                    {formatNaira(order.total_amount)}
                  </p>
                  <p className="text-gray-600 flex items-center mb-2">
                    <ShoppingBagIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="font-medium">Rider:</span>{" "}
                    {order.rider?.name || "Unassigned"}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
