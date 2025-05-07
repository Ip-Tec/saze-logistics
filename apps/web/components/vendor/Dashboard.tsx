// components/vendor/Dashboard.tsx
"use client";

import { useAuthContext } from "@/context/AuthContext";
import { Loader2 } from "lucide-react"; // Keep loader for initial user check
import MetricsRow from "@/components/vendor/MetricsRow";
import OrderManagement from "@/components/vendor/OrderManagement";
import SalesOverview from "@/components/vendor/SalesOverview";
import ProductListings from "@/components/vendor/ProductListings";
import ActiveMenuItemsSummary from "@/components/vendor/ActiveMenuItemsSummary"; // Import the new summary component

export default function VendorDashboard() {
  const { user, isCheckingAuth: isUserLoading } = useAuthContext(); // Get loading state from context

  // Handle initial user loading state
  console.log("isUserLoading", { isUserLoading });
  if (isUserLoading) {
    return (
      <div className="flex w-full justify-center items-center h-screen">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="ml-2 text-gray-700">Loading user...</p>
      </div>
    );
  }

  // Handle not logged in state after user check
  if (!user?.id) {
    return (
      <div className="text-orange-500 text-center mt-8">
        <p>Vendor not logged in.</p>
        {/* A link to login */}
        <p className="m-2 text-lg">
          <a href="/auth/login">Login</a>
        </p>
      </div>
    );
  }
console.log({ user });
  const vendorId = user.id;

  return (
    <div className="p-6 space-y-6 w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-400">Vendor Dashboard</h1>
        {/* Placeholder for profile icon */}
        {/* Assuming user has a profile image URL */}
        <div className="w-10 h-10 rounded-full bg-orange-500/40 flex items-center justify-center text-black font-semibold overflow-hidden">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            user?.name?.[0]?.toUpperCase() || "S"
          )}
        </div>
      </div>

      {/* Top Metrics Row */}
      <MetricsRow vendorId={vendorId} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Use 3 columns for md+ */}
        {/* Left Column (Span 2 columns on md+) */}
        <div className="md:col-span-1 space-y-6">
          <OrderManagement vendorId={vendorId} />
          {/* Place Active Menu Items Summary here */}
          <ActiveMenuItemsSummary vendorId={vendorId} />
        </div>
        {/* Right Column (Span 1 column on md+) */}
        <div className="md:col-span-1 space-y-6">
          <SalesOverview vendorId={vendorId} />
          {/* Place Product Listings (detailed) here if needed, matching screenshot's right side */}
          {/* ProductListings vendorId={vendorId} /> */}
          {/* Let's put the ProductListings (the one with image/name/price/stock) on the right */}
          <ProductListings vendorId={vendorId} />
        </div>
      </div>
    </div>
  );
}
