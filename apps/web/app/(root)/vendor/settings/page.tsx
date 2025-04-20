"use client";

import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import Logo from "@/public/images/logo.png";
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";
import { useVendorProfile } from "@/hooks/useVendorProfile";
import { PencilIcon, SaveIcon, CameraIcon, Loader2, X } from "lucide-react";

export default function VendorSettingsPage() {
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // store original profile values for cancel
  const [originalProfile, setOriginalProfile] = useState({
    name: "",
    description: "",
    address: "",
    contact: "",
    logo: "",
    banner: "",
  });

  const profile = useVendorProfile();

  const {
    name,
    setName,
    description,
    setDescription,
    address,
    setAddress,
    contact,
    setContact,
    logoPreview,
    setLogo,
    setLogoPreview,
    bannerPreview,
    setBanner,
    setBannerPreview,
    updateProfile,
    changePassword,
  } = profile;

  useEffect(() => {
    // save initial values for cancel
    setOriginalProfile({
      name,
      description,
      address,
      contact,
      logo: logoPreview,
      banner: bannerPreview,
    });
  }, []);

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

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateProfile();
    setIsSaving(false);
    if (success) {
      toast.success("Profile updated");
      setOriginalProfile({
        name,
        description,
        address,
        contact,
        logo: logoPreview,
        banner: bannerPreview,
      });
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setName(originalProfile.name);
    setDescription(originalProfile.description);
    setAddress(originalProfile.address);
    setContact(originalProfile.contact);
    setLogoPreview(originalProfile.logo);
    setBannerPreview(originalProfile.banner);
    setEditing(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="p-6 flex flex-wrap gap-6 text-white !bg-blue-950/20 w-full h-auto overflow-y-auto glass-scrollbar">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendor Settings</h1>
        <div className="flex gap-3">
          {editing && (
            <GlassButton
              onClick={handleCancel}
              className="text-sm flex items-center gap-1 bg-red-500 hover:bg-red-600"
            >
              <X size={16} />
              Cancel
            </GlassButton>
          )}
          <GlassButton
            onClick={editing ? handleSave : () => setEditing(true)}
            className="text-sm flex items-center gap-1"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : editing ? (
              <>
                <SaveIcon size={16} />
                Save
              </>
            ) : (
              <>
                <PencilIcon size={16} />
                Edit
              </>
            )}
          </GlassButton>
        </div>
      </div>

      <GlassDiv className="w-full">
        <div className="relative w-full h-60">
          <img src={bannerPreview} className="w-full h-full object-cover" />
          {editing && (
            <label className="absolute top-2 right-2 bg-black/50 p-2 rounded-full cursor-pointer">
              <CameraIcon size={18} />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "banner")}
              />
            </label>
          )}
          <div className="absolute bottom-0 left-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white">
              <img src={logoPreview} className="w-full h-full object-cover" />
              {editing && (
                <label className="absolute top-10 right-2 bg-black/50 p-1 rounded-full cursor-pointer">
                  <CameraIcon size={16} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
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

      {/* Address */}
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

      {/* Contact */}
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

      {/* Password */}
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

// Reusable Components
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
