"use client";

import React, { useState } from "react";

export default function VendorSettingsPage() {
  const [name, setName] = useState("My Delicious Kitchen");
  const [description, setDescription] = useState(
    "We serve the best meals in town."
  );
  const [address, setAddress] = useState("123 Food Street, Flavor City");
  const [contact, setContact] = useState("08012345678");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = () => {
    console.log("Updating vendor profile...", {
      name,
      description,
      address,
      contact,
      image,
    });
    // Send to API or local storage
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log("Changing password...", {
      currentPassword,
      newPassword,
    });
    // Send to API
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold">Vendor Settings</h1>

      {/* Profile Section */}
      <section className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md space-y-6">
        <h2 className="text-xl font-semibold">Business Info</h2>

        <div>
          <label className="block font-medium mb-1">Business Name</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            className="w-full border p-2 rounded"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Address</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Contact</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Business Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-2 w-full max-h-48 object-cover rounded"
            />
          )}
        </div>

        <button
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
          onClick={handleUpdateProfile}
        >
          Update Business Info
        </button>
      </section>

      {/* Password Section */}
      <section className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md space-y-6">
        <h2 className="text-xl font-semibold">Change Password</h2>

        <div>
          <label className="block font-medium mb-1">Current Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">New Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Confirm New Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          className="bg-red-600 text-white py-2 px-6 rounded hover:bg-red-700"
          onClick={handlePasswordChange}
        >
          Change Password
        </button>
      </section>
    </div>
  );
}
