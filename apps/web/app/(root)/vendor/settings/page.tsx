"use client";

import GlassDiv from "@/components/ui/GlassDiv";
import React, { useState } from "react";
import { PencilIcon, SaveIcon, CameraIcon } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";

export default function VendorSettingsPage() {
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("My Delicious Kitchen");
  const [description, setDescription] = useState(
    "We serve the best meals in town."
  );
  const [address, setAddress] = useState("123 Food Street, Flavor City");
  const [contact, setContact] = useState("08012345678");

  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("/default-logo.png");
  const [bannerPreview, setBannerPreview] = useState<string>(
    "/default-banner.jpg"
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleEdit = () => setEditing(!editing);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);

    if (type === "logo") {
      setLogo(file);
      setLogoPreview(preview);
    } else {
      setBanner(file);
      setBannerPreview(preview);
    }
  };

  const handleUpdateProfile = () => {
    console.log("Updating profile with:", {
      name,
      description,
      address,
      contact,
      logo,
      banner,
    });
    setEditing(false);
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Changing password...", { currentPassword, newPassword });
  };

  return (
    <div className="p-6 flex flex-wrap gap-6 justify-start items-start overflow-y-scroll glass-scrollbar text-white">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendor Settings</h1>
        <GlassButton
          onClick={editing ? handleUpdateProfile : toggleEdit}
          className="text-sm flex items-center gap-1"
        >
          {editing ? <SaveIcon size={16} /> : <PencilIcon size={16} />}
          {editing ? "Save" : "Edit"}
        </GlassButton>
      </div>

      {/* Banner + Logo Section */}
      <GlassDiv className="w-full rounded-2xl overflow-hidden">
        <div className="relative w-full h-60 rounded-xl overflow-hidden">
          <img
            src={bannerPreview}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          {editing && (
            <label className="absolute top-2 right-2 bg-black/50 p-2 rounded-full cursor-pointer hover:bg-black/70">
              <CameraIcon className="text-white" size={18} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, "banner")}
              />
            </label>
          )}
          <div className="absolute bottom-0 left-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white">
              <img
                src={logoPreview}
                alt="Logo"
                className="w-full h-full object-cover"
              />
              {editing && (
                <label className="absolute top-10 right-2 bg-black/50 p-1 rounded-full cursor-pointer hover:bg-black/70">
                  <CameraIcon className="text-white" size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, "logo")}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </GlassDiv>

      {/* Personal Info */}
      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Personal Information">
          {editing ? (
            <>
              <Input label="Business Name" value={name} onChange={setName} />
              <TextArea
                label="Description"
                value={description}
                onChange={setDescription}
              />
            </>
          ) : (
            <DisplayInfo
              items={[
                { label: "Business Name", value: name },
                { label: "Description", value: description },
              ]}
            />
          )}
        </Section>
      </GlassDiv>

      {/* Address Info */}
      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Address">
          {editing ? (
            <Input
              label="Business Address"
              value={address}
              onChange={setAddress}
            />
          ) : (
            <DisplayInfo
              items={[{ label: "Business Address", value: address }]}
            />
          )}
        </Section>
      </GlassDiv>

      {/* Contact Info */}
      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Contact">
          {editing ? (
            <Input
              label="Phone / Contact"
              value={contact}
              onChange={setContact}
            />
          ) : (
            <DisplayInfo
              items={[{ label: "Phone / Contact", value: contact }]}
            />
          )}
        </Section>
      </GlassDiv>

      {/* Password Change */}
      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Change Password">
          <p className="text-sm text-gray-100">
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
          <GlassButton
            className="py-2 px-6 rounded"
            onClick={handlePasswordChange}
          >
            Change Password
          </GlassButton>
        </Section>
      </GlassDiv>
    </div>
  );
}

// ------------------ Reusable Components ------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

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

function DisplayInfo({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="space-y-2 text-gray-100">
      {items.map((item, idx) => (
        <div key={idx}>
          <p className="text-sm font-medium text-white">{item.label}</p>
          <p className="text-gray-300">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
