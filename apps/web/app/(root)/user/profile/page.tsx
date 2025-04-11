"use client";
import React from "react";
import { BaseUser as User, Rider, Vendor } from "@shared/types"; // optional: type safety if you have types defined
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";

const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "https://i.pravatar.cc/150?img=12", // fake avatar
};

const orderHistory = [
  { id: 1, name: "Burger King", date: "March 30, 2025", status: "Delivered" },
  { id: 2, name: "KFC", date: "March 28, 2025", status: "Cancelled" },
];

const savedAddresses = [
  { id: 1, label: "Home", details: "123 Main Street, Cityville" },
  { id: 2, label: "Work", details: "56 Office Blvd, Business Bay" },
];

const UserProfile = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 space-y-10">
        {/* Profile Header */}
        <GlassDiv className="flex items-center gap-4">
          <img
            src={mockUser.avatar}
            alt={mockUser.name}
            className="w-16 h-16 rounded-full border"
          />
          <div>
            <h2 className="text-xl font-semibold">{mockUser.name}</h2>
            <p className="text-gray-500">{mockUser.email}</p>
          </div>
          <div className="ml-auto">
            <GlassButton className="text-sm text-yellow-500 hover:underline">
              Edit Profile
            </GlassButton>
          </div>
        </GlassDiv>

        {/* Order History */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Order History</h3>
          {orderHistory.length === 0 ? (
            <p className="text-gray-400">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {orderHistory.map((order) => (
                <li
                  key={order.id}
                  className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{order.name}</p>
                    <p className="text-sm text-gray-500">{order.date}</p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      order.status === "Delivered"
                        ? "text-green-500"
                        : "text-red-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Saved Addresses */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Saved Addresses</h3>
          <ul className="space-y-2">
            {savedAddresses.map((address) => (
              <li
                key={address.id}
                className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded-lg"
              >
                <div>
                  <p className="font-medium">{address.label}</p>
                  <p className="text-sm text-gray-500">{address.details}</p>
                </div>
                <GlassButton className="text-sm text-yellow-500 hover:underline">
                  Edit
                </GlassButton>
              </li>
            ))}
          </ul>
        </div>

        {/* Logout */}
        <div className="text-center">
          <GlassButton className="text-red-500 font-medium hover:underline">
            Logout
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
