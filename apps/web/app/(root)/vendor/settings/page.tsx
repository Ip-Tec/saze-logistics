"use client";

import GlassDiv from "@/components/ui/GlassDiv";
import React, { useState } from "react";
import { PencilIcon, SaveIcon } from "lucide-react";

export default function VendorSettingsPage() {
  const [editing, setEditing] = useState(false);

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

  const toggleEdit = () => setEditing(!editing);

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
    setEditing(false);
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
  };

  return (
    <div className="p-6 mx-auto space-y-10 !text-white">
      <h1 className="text-2xl font-bold">Vendor Settings</h1>

      {/* Profile Group */}
      <div className=" flex flex-wrap items-center justify-between gap-3 !overflow-auto">
        <GlassDiv className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Business Info</h2>
              <p className="text-sm text-gray-300">
                Your public-facing vendor profile.
              </p>
            </div>
            <button
              onClick={toggleEdit}
              className="text-sm text-blue-500 hover:underline flex items-center gap-1"
            >
              {editing ? <SaveIcon size={16} /> : <PencilIcon size={16} />}
              {editing ? "Save" : "Edit"}
            </button>
          </div>

          {editing ? (
            <>
              <Input label="Business Name" value={name} onChange={setName} />
              <TextArea
                label="Description"
                value={description}
                onChange={setDescription}
              />
              <Input label="Address" value={address} onChange={setAddress} />
              <Input label="Contact" value={contact} onChange={setContact} />

              <div>
                <label className="block font-medium mb-1">Business Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 w-full max-h-48 object-cover rounded"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2 text-gray-100">
              <InfoItem label="Business Name" value={name} />
              <InfoItem label="Description" value={description} />
              <InfoItem label="Address" value={address} />
              <InfoItem label="Contact" value={contact} />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-2 w-full max-h-48 object-cover rounded"
                />
              )}
            </div>
          )}
        </GlassDiv>

        {/* Password Group */}
        <GlassDiv className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20 shadow-md space-y-6">
          <h2 className="text-xl font-semibold">Change Password</h2>
          <p className="text-sm text-gray-300 mb-3">
            Update your password to keep your account secure.
          </p>

          <InputPassword
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <InputPassword
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
          />
          <InputPassword
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />

          <button
            className="bg-red-600 text-white py-2 px-6 rounded hover:bg-red-700"
            onClick={handlePasswordChange}
          >
            Change Password
          </button>
        </GlassDiv>
      </div>
    </div>
  );
}

// ------------------ Reusable UI components ------------------

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <input
        type="text"
        className="w-full border p-2 rounded bg-white/5 text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function InputPassword({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <input
        type="password"
        className="w-full border p-2 rounded bg-white/5 text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <textarea
        className="w-full border p-2 rounded bg-white/5 text-white"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-gray-300">{value}</p>
    </div>
  );
}
