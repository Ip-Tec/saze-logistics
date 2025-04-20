"use client";

import GlassDiv from "@/components/ui/GlassDiv";
import React, { useEffect, useState } from "react";
import { PencilIcon, SaveIcon } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import ChangePassword from "@/components/auth/ChangePassword";

export default function RiderSettingsPage() {
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("John Doe");
  const [vehicleType, setVehicleType] = useState("Motorcycle");
  const [licensePlate, setLicensePlate] = useState("ABC-1234");
  const [contact, setContact] = useState("08012345678");
  const [altContact, setAltContact] = useState("08098765432");
  const [email, setEmail] = useState("johndoe@example.com");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [riderImage, setRiderImage] = useState<File | null>(null);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [riderImageURL, setRiderImageURL] = useState<string | null>(null);
  const [vehicleImageURL, setVehicleImageURL] = useState<string | null>(null);

  const toggleEdit = () => setEditing(!editing);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file);
      previewSetter(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = () => {
    console.log("Updating rider profile with:", {
      name,
      vehicleType,
      licensePlate,
      contact,
      altContact,
      email,
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

  useEffect(() => {
    return () => {
      if (riderImageURL) URL.revokeObjectURL(riderImageURL);
      if (vehicleImageURL) URL.revokeObjectURL(vehicleImageURL);
    };
  }, [riderImageURL, vehicleImageURL]);

  return (
    <div className="p-6 flex flex-wrap gap-6 justify-start items-start overflow-y-scroll glass-scrollbar text-gray-800">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rider Settings</h1>
        <GlassButton
          onClick={editing ? handleUpdateProfile : toggleEdit}
          className="text-sm flex !bg-orange-500 items-center gap-1 hover:!text-orange-500"
        >
          {editing ? <SaveIcon size={16} /> : <PencilIcon size={16} />}
          {editing ? "Save" : "Edit"}
        </GlassButton>
      </div>

      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Personal Information">
          {editing ? (
            <>
              <Input label="Full Name" value={name} onChange={setName} />
              <Input
                label="Vehicle Type"
                value={vehicleType}
                onChange={setVehicleType}
              />
              <Input
                label="License Plate"
                value={licensePlate}
                onChange={setLicensePlate}
              />

              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Rider Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageChange(e, setRiderImage, setRiderImageURL)
                  }
                />
                {riderImageURL && (
                  <img
                    src={riderImageURL}
                    alt="Rider"
                    className="w-24 h-24 object-cover rounded-full border"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Vehicle Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageChange(e, setVehicleImage, setVehicleImageURL)
                  }
                />
                {vehicleImageURL && (
                  <img
                    src={vehicleImageURL}
                    alt="Vehicle"
                    className="w-32 h-24 object-cover rounded border"
                  />
                )}
              </div>
            </>
          ) : (
            <DisplayInfo
              items={[
                { label: "Full Name", value: name },
                { label: "Vehicle Type", value: vehicleType },
                { label: "License Plate", value: licensePlate },
              ]}
            >
              <div className="flex gap-4 mt-4">
                {riderImageURL && (
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      Rider Photo
                    </p>
                    <img
                      src={riderImageURL}
                      alt="Rider"
                      className="w-24 h-24 object-cover rounded-full border"
                    />
                  </div>
                )}
                {vehicleImageURL && (
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      Vehicle Photo
                    </p>
                    <img
                      src={vehicleImageURL}
                      alt="Vehicle"
                      className="w-32 h-24 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </DisplayInfo>
          )}
        </Section>
      </GlassDiv>

      <GlassDiv className="w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4">
        <Section title="Contact">
          {editing ? (
            <>
              <Input
                label="Phone / Contact"
                value={contact}
                onChange={setContact}
              />
              <Input
                label="Alternate Contact"
                value={altContact}
                onChange={setAltContact}
              />
              <Input label="Email Address" value={email} onChange={setEmail} />
            </>
          ) : (
            <DisplayInfo
              items={[
                { label: "Phone / Contact", value: contact },
                { label: "Alternate Contact", value: altContact },
                { label: "Email Address", value: email },
              ]}
            />
          )}
        </Section>
      </GlassDiv>

      <ChangePassword className="!text-black" buttonStyle=" !bg-orange-500 hover:!bg-orange-100 hover:!text-orange-500"/>
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
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
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
      <label className="block font-medium mb-1 text-gray-700">{label}</label>
      <input
        type="text"
        className="w-full border p-2 rounded bg-white/40 text-gray-800 placeholder:text-gray-500"
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
      <label className="block font-medium mb-1 text-gray-700">{label}</label>
      <input
        type="password"
        className="w-full border p-2 rounded bg-white/40 text-gray-800 placeholder:text-gray-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DisplayInfo({
  items,
  children, // Accept children prop
}: {
  items: { label: string; value: string }[];
  children?: React.ReactNode; // children is now optional
}) {
  return (
    <div className="space-y-2 text-gray-800">
      {items.map((item, idx) => (
        <div key={idx}>
          <p className="text-sm font-medium text-gray-700">{item.label}</p>
          <p className="text-gray-800">{item.value}</p>
        </div>
      ))}
      {children} {/* Render children here */}
    </div>
  );
}
