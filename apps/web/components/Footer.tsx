import React from "react";

const Footer = () => {
  return (
    <footer className="to-blue-600 text-white py-6 w-full">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Saze Logistics. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
