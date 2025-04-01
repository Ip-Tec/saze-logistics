import React from "react";
import MapBg from "@/public/images/map.jpg";
import Image from "next/image";

const Vendors = () => {
  return (
    <div className="relative w-full h-full text-black">
      {/* Parallax Background */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${MapBg.src})` }}
      ></div>

      {/* Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-black/50 bg-opacity-50 py-12 px-4">
        <div className="w-full flex justify-center leading-10 mx-auto text-white">
          <p className="mb-4 max-w-xl text-center">
            Whether it’s a quick <strong>Nkwobi</strong> snack or a full{" "}
            <strong>Ofada Rice</strong> feast, get your favorite food delivered
            quickly and reliably. Enjoy the taste of home or explore new ones
            without the hassle!
          </p>
        </div>
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          Top Restaurants
        </h2>

        {/* Vendors Section */}
        <div className="container mx-auto relative z-20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Some Of Our Vendors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Vendor Cards */}
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-white rounded-lg shadow-md p-6">
                <Image
                  src={`/vendor${num}.jpg`} // Replace with actual image paths
                  alt={`Vendor ${num}`}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover mb-4 rounded-lg"
                />
                <h3 className="text-xl font-bold mb-2">Vendor {num}</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vendors;
