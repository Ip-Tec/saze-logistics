"use client";

import React from "react";

const AuthCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Welcome to Sazee Logistics
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Sign in to track shipments, schedule deliveries, or manage your
          logistics dashboard.
        </p>
        {children}
      </div>
    </div>
  );
};

export default AuthCard;
