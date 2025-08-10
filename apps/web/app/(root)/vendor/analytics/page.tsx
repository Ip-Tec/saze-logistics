"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalEarnings: number;
  ordersThisMonth: number;
};

export default function VendorAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/vendor/analytics")
      .then((res) => res.json())
      .then((data: Stats) => setStats(data));
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
          {/* I changed monthEarnings -> ordersThisMonth to match API */}
          <p className="text-lg font-semibold">{stats.ordersThisMonth}</p>
        </div>
      </div>
    </div>
  );
}
