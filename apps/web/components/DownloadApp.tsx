"use client";

import React from "react";
import Image from "next/image";
import playstore from "@/public/images/mockup.png";
import appstore from "@/public/images/mockup.png";

const DownloadApp = () => {
  return (
    <section className="py-16 w-full px-8 bg-gray-100 text-center">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
        Download the Sazee Logistics App
      </h2>
      <p className="text-gray-600 max-w-xl mx-auto mb-8">
        Book shipments, track your deliveries in real-time, and manage logistics
        from anywhere with our mobile app. Available on iOS and Android.
      </p>

      <div className="flex justify-center space-x-4">
        <a href="#" target="_blank" rel="noopener noreferrer">
          <Image src={playstore} alt="Get it on Google Play" width={150} />
        </a>
        {/*  <a href="#" target="_blank" rel="noopener noreferrer">
          <Image src={appstore} alt="Download on the App Store" width={150} />
        </a>  */}
      </div>
    </section>
  );
};

export default DownloadApp;
