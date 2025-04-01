import React from "react";
import Image from "next/image";
import Rider from "@/public/images/rider.jpg";

/*
 * Let Do It Together
 * @description: This component will be used to display the Login page for user, vendor, and rider
 * Card for user, vendor, and rider  to login
 * */

const LetDoItTogether: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-16">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">Let's do it together</h2>
      </div>
      {/* Card for user, vendor, and rider  to login*/}
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card for user */}
        <div className="bg-white text-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">User</h3>
          <p className="text-gray-600 mb-4">Login to your account</p>
          <button className="bg-gradient-to-br from-yellow-200 to-blue-500 px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition duration-300 cursor-pointer">
            Login
          </button>
        </div>

        {/* Card for vendor */}
        <div className="bg-white text-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Vendor</h3>
          <p className="text-gray-600 mb-4">Login to your account</p>
          <button className="bg-gradient-to-br from-yellow-200 to-blue-500 px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition duration-300 cursor-pointer">
            Login
          </button>
        </div>

        {/* Card for rider */}
        <div className="bg-white text-gray-800 rounded-lg shadow-md p-6">
          <Image src={Rider} alt="Rider" width={100} height={100} />
          <h3 className="text-xl font-semibold mb-4">Rider</h3>
          <p className="text-gray-600 mb-4">Login to your account</p>
          <button className="bg-gradient-to-br from-yellow-200 to-blue-500 px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition duration-300 cursor-pointer">
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LetDoItTogether;
