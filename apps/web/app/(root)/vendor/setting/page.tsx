"use client";

import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import Logo from "@/public/images/logo.png";
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";
import { useVendorProfile } from "@/hooks/useVendorProfile";
import { PencilIcon, SaveIcon, CameraIcon, Loader2, X } from "lucide-react";
import Section from "@/components/reuse/Section";
import Input from "@/components/reuse/Input";
import TextArea from "@/components/reuse/TextArea";
import DisplayInfo from "@/components/reuse/DisplayInfo";
import ChangePassword from "@/components/auth/ChangePassword"

export default function VendorSettingsPage() {
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
 

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
    setLogoPreview,
    bannerPreview,
    setBannerPreview,
    updateProfile,
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
      setLogoPreview(preview);
    } else {
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
      <ChangePassword className="" />
    </div>
  );
}

// Reusable Components