"use client"; // This ensures it's a client-side component

import React from "react";
import { useAuthContext } from "@/context/AuthContext"; // Ensure correct path to AuthContext
import VendorMenuPage from "@/components/vendor/VendorMenuPage";
import UserOrderPage from "./UserOrderPage";

const UserPage = () => {
  const { user } = useAuthContext(); // Fetch user from context

  return (
    <>
      <h2>User Page</h2>
      {user ? (
        <div>
          <p>Name: {user?.name}</p>
          <p>Email: {user?.email}</p>
          <p>Phone: {user?.phone}</p>
          <p>Role: {user?.role}</p>
          <p>Second Phone: {user?.second_phone}</p>
          <p>Created At: {user?.created_at}</p>
        </div>
      ) : (
        <p>Loading user information...</p>
      )}
      <UserOrderPage />
    </>
  );
};

export default UserPage;
