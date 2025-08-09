"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Vendor } from "@shared/types";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("/api/vendors")
      .then((res) => res.json())
      .then((data) => {
        console.log({ data });
        if (data.error) {
          setError(data.error);
        } else {
          setVendors(data);
        }
      })
      .catch((err) => setError(err));
  }, []);

  return (
    <div className="p-4 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Vendors</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {vendors.length > 0 ? (
          vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="border rounded-lg p-4 shadow hover:shadow-lg transition"
            >
              <img
                src={vendor.logo_url}
                alt={vendor.name}
                title={vendor.name}
                className="bg-gray-700/80 w-30 h-30 object-cover rounded-full mx-auto"
              />
              
              <h2 className="mt-2 text-center font-semibold">{vendor.name}</h2>
              {/* <p className="text-sm text-gray-500 text-center">{vendor.category}</p> */}
              <Link
                href={`/user/vendors/${vendor.id}`}
                className="block text-center mt-3 bg-blue-500 text-white py-1 rounded hover:bg-blue-600"
              >
                View Menu
              </Link>
            </div>
          ))
        ) : (
          // Error message from API
          <div className="flex w-full flex-col items-center justify-center h-full">
            <h3 className="text-red-500">{error || "No vendors found"}</h3>
            <p className="text-sm text-gray-500 text-center">
              Please try again later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
