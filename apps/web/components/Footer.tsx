"use client";

import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-orange-700 w-full text-white py-12 px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Sazee Logistics</h3>
          <p className="text-sm text-gray-300">
            Reliable, fast, and secure delivery solutions for individuals, small
            businesses, and large enterprises.
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-3">Services</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <Link href="/services">Courier & Express</Link>
            </li>
            <li>
              <Link href="/services">Freight Delivery</Link>
            </li>
            <li>
              <Link href="/services">Same-Day Dispatch</Link>
            </li>
            <li>
              <Link href="/services">Warehousing</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/partner">Partner With Us</Link>
            </li>
            <li>
              <Link href="/careers">Careers</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <Link href="/track">Track Your Package</Link>
            </li>
            <li>
              <Link href="/help">Help Center</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Sazee Logistics. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
