import React from "react";
import Image from "next/image";
import MockUp from "@/public/images/mockup.png";

/*
 * Download App
 *
 * TODO: add the mockup image off the add
 *  add a Google and Apple download button
 *  make the mockup look like a 3D image
 *  when user click on the download it take the to the store to install the app
 *
 */
const DownloadApp = () => {
  return (
    <div
      className={`w-full h-full flex items-center justify-evenly py-12 text-white bg-gradient-to-br from-yellow-400 to-blue-500`}
    >
      <div className="rounded-lg p-8 text-center">
        <h3 className="text-3xl font-bold mb-4">Download the app</h3>
        <p className="text-lg mb-8">
          Order anything and track it in real time with the Saze app.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button className="bg-gradient-to-br from-yellow-200 to-blue-500 px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition duration-300 cursor-pointer">
            Google Download
          </button>
          <button className="bg-gradient-to-br from-yellow-200 to-blue-500 px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition duration-300 cursor-pointer">
            Apple Download
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center max-h-1/2">
        <Image src={MockUp} alt="Saze app icon" className="w-auto h-auto" />
      </div>
    </div>
  );
};

export default DownloadApp;
