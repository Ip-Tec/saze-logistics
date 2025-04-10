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
            Delivery
          </h1>
          <h2 className="text-2xl font-medium text-gray-700">Foods Place</h2>
          <h4 className="text-xl font-medium text-gray-500">
            Your Favorite Food, Delivered Fast
          </h4>
          <p className="text-gray-400 mt-4 md:px-4 max-w-md">
            From spicy <strong>Jollof Rice</strong> and smoky{" "}
            <strong>Suya</strong> to rich <strong>Egusi Soup</strong> and crispy{" "}
            <strong>Puff Puff</strong>, we bring you authentic flavors from
            top-rated restaurants and local chefs. Craving{" "}
            <strong>Amala & Ewedu, Pepper Soup,</strong> or even Chinese or
            Lebanese favorites? We have got you covered!
          </p>
          <div className="flex">
            <Link
              href={"/order/"}
              className="mt-10 px-6 py-3 bg-yellow-400 text-white rounded-lg shadow-md hover:bg-yellow-500 font-semibold"
            >
              ORDER NOW
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={
          "transform rotate-180 bg-gradient-to-bl from-yellow-400 to-blue-500"
        }
        viewBox="0 0 1440 320"
      >
        <path
          fill="#FFF"
          className="fill-white border-none"
          fillOpacity="1"
          d="M0,192L48,213.3C96,235,192,277,288,277.3C384,277,480,235,576,186.7C672,139,768,85,864,90.7C960,96,1056,160,1152,160C1248,160,1344,96,1392,64L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </section>
  );
};

export default HeroSection;
