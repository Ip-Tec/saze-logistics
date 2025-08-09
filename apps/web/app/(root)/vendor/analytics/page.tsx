"use client";

import { useEffect, useState } from "react";

export default function VendorAnalyticsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/vendor/analytics") // vendor auth required
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Vendor Analytics</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white shadow rounded">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-lg font-semibold">₦{stats.totalEarnings}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-lg font-semibold">₦{stats.monthEarnings}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="text-lg font-semibold">{stats.totalOrders}</p>
        </div>
      </div>
      {/* Add chart and filters here */}
    </div>
  );
}
