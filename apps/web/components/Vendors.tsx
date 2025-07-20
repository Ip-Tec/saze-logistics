"use client";

import React from "react";

const Vendors = () => {
  return (
    <section className="py-16 px-8 bg-white text-center">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-6">
        Trusted Delivery Partners
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto mb-10">
        We collaborate with a wide network of experienced couriers, fleet
        owners, and regional hubs to ensure every package gets delivered safely
        and on time.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Riders & Couriers</h3>
          <p className="text-gray-500">
            Trained professionals delivering across urban and rural areas.
          </p>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Fleet Partners</h3>
          <p className="text-gray-500">
            Reliable van and truck operators for bulk and commercial shipments.
          </p>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Regional Hubs</h3>
          <p className="text-gray-500">
            Strategically placed hubs for faster inter-city transfers and
            storage.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Vendors;
