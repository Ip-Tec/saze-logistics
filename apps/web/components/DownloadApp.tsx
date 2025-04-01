import React from "react";
import Image from "next/image";
import Logo from "@/public/images/logo.png";

const DownloadApp = () => {
  return (
    <div
      className={`w-full h-full flex items-center justify-center py-12 text-black bg-gradient-to-br from-yellow-400 to-blue-500`}
    >
      <div className="mx-auto text-center">
        <h3 className="text-3xl font-bold mb-4">Download the app</h3>
        <p className="text-lg mb-8">
          Order anything and track it in real time with the Saze app.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <Image src={Logo} alt="Saze app icon" className="w-32 h-32" />
        <button className="bg-blue-600 text-black px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition duration-300">
          Download
        </button>
      </div>
    </div>
  );
};

export default DownloadApp;
