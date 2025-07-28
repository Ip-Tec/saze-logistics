"use client";

import React from "react";

const AnythingDelivered = () => {
  return (
    <section className="w-full bg-gray-100 py-16 px-8 text-center">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-6">
        We Deliver Anything, Anywhere
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto mb-10">
        From confidential documents to large cargo, Sazee Logistics makes sure
        your items are delivered safely and on time. No item is too small or too
        big — if it fits, we ship it!
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md hover:bg-orange-500 hover:text-white group">
          <h3 className="text-xl font-semibold mb-2">Documents</h3>
          <p className="text-gray-500 group-hover:text-gray-200">
            Secure and fast delivery of legal, academic, and business papers.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:bg-orange-500 hover:text-white group">
          <h3 className="text-xl font-semibold mb-2">Parcels</h3>
          <p className="text-gray-500 group-hover:text-gray-200">
            Trackable parcel delivery to homes or offices across the country.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:bg-orange-500 hover:text-white group">
          <h3 className="text-xl font-semibold mb-2">Retail Packages</h3>
          <p className="text-gray-500 group-hover:text-gray-200">
            Courier solutions for e-commerce, small businesses, and drop-off
            orders.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:bg-orange-500 hover:text-white group">
          <h3 className="text-xl font-semibold mb-2">Bulk Freight</h3>
          <p className="text-gray-500 group-hover:text-gray-200">
            Efficient delivery of large items, bulk goods, and industrial
            supplies.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AnythingDelivered;
