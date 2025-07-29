"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LogIn, UserPlus, Truck, Store, ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const [showRegisterOptions, setShowRegisterOptions] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 transition-all duration-300">
        {!showRegisterOptions ? (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
              Where do you want to go?
            </h2>

            <div className="flex flex-col gap-6">
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition-all"
              >
                <LogIn className="w-5 h-5" />
                Login
              </Link>

              <button
                onClick={() => setShowRegisterOptions(true)}
                className="flex items-center justify-center gap-3 bg-yellow-400 text-white py-4 rounded-xl text-lg font-medium hover:bg-yellow-500 transition-all"
              >
                <UserPlus className="w-5 h-5" />
                Register
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowRegisterOptions(false)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </button>
              <h2 className="text-xl font-bold text-gray-800">Register As</h2>
              <div className="w-6" /> {/* spacer for symmetry */}
            </div>

            <div className="space-y-4">
              <Link
                href="/auth/register?role=user"
                className="block w-full text-center bg-gray-100 py-4 rounded-xl hover:bg-gray-200 transition shadow-sm font-medium"
              >
                👤 User
              </Link>
              <Link
                href="/auth/register?role=rider"
                className="block w-full text-center bg-gray-100 py-4 rounded-xl hover:bg-gray-200 transition shadow-sm font-medium"
              >
                🛵 Rider
              </Link>
              <Link
                href="/auth/register?role=vendor"
                className="block w-full text-center bg-gray-100 py-4 rounded-xl hover:bg-gray-200 transition shadow-sm font-medium"
              >
                🏪 Vendor
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
