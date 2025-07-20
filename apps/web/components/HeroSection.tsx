"use client";

import Image from "next/image";
import Bike from "@/public/images/bike_.png";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="relative w-full bg-white text-gray-800 overflow-hidden mt-8">
      {/* Background Overlay */}

      <div className="relative z-10 max-w-full mx-auto flex flex-col md:flex-row items-center px-8 py-12">
        {/* Left Content */}
        <div className="md:w-1/2 text-justify md:text-left">
          <div className="inline-block px-4 py-2 bg-black text-white rounded-full text-sm font-semibold">
            Sazee
          </div>
          <h1 className="text-5xl font-extrabold text-primary mt-4">
            Your Trusted Logistics Partner
          </h1>
          <h2 className="text-2xl font-medium text-gray-700">
            Reliable Parcel & Freight Delivery Nationwide
          </h2>
          <h4 className="text-xl font-medium text-gray-500">
            Fast, Safe & Affordable Shipping
          </h4>
          <p className="text-gray-400 md:px-4 max-w-md">
            Sazee Logistics is your all-in-one shipping solution. From small
            packages to large freight, we ensure your deliveries arrive safely
            and on time. Whether you're sending documents across town or cargo
            across the country, we've got you covered.
          </p>
          <div className="flex">
            <Link
              href={"/order/"}
              className="mt-10 px-6 py-3 bg-orange-400 text-white rounded-lg shadow-md hover:bg-orange-500 font-semibold"
            >
              SHIP NOW
            </Link>
          </div>
        </div>

        {/* Right Content - Image */}
        <div className="shapeless-liquid-hero md:px-16 -z-40 rounded-full md:w-1/2 flex justify-center top-[7rem] md:top-20 right-0 w-screen h-full">
          <Image
            src={Bike}
            alt="Delicious Food"
            width={500}
            height={500}
            className="w-[16rem] md:w-[32rem] absolute bottom-[-3rem] sm:transform md:rotate-0 rotate-[-8.9deg] md:-bottom-10  right-0 -z-50 object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
