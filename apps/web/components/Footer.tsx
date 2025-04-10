import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-yellow-500 text-white py-6 w-full">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Sazee Logistics. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
