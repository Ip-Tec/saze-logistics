"use client";

import React from "react";
import Link from "next/link";

const LetDoItTogether = () => {
  return (
    <section className="bg-orange-400 w-full text-white py-16 px-8 text-center">
      <h2 className="text-4xl font-extrabold mb-4">
        Let's Deliver the Future of Logistics
      </h2>
      <p className="max-w-2xl mx-auto text-lg mb-6">
        Join Sazee Logistics as a delivery partner or service provider. Let's
        build a smarter, faster logistics network together — one package at a
        time.
      </p>
      <Link
        href="/auth"
        className="inline-block mt-4 px-6 py-3 bg-orange-700 text-white rounded-lg font-semibold hover:bg-orange-800"
      >
        Become a Partner
      </Link>
    </section>
  );
};

export default LetDoItTogether;
