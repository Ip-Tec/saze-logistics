// hooks/useVendorProfile.ts
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "@shared/supabaseClient";
import { useAuthContext } from "../context/AuthContext";

export type VendorProfile = {
  id: string;
  name: string;
  description: string;
  address: string;
  contact: string;
  logo: string;
  banner: string;
};

export function useVendorProfile() {
  const { user } = useAuthContext();
  const vendorId = user?.id;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  // 1) fetch existing vendor profile
  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", vendorId)
        .single();
      if (error || !data) {
        toast.error("Could not load vendor profile.");
      } else {
        setProfile(data);
        setName(data.name);
        setDescription(data.description);
        setAddress(data.address);
        setContact(data.contact);
        setLogoPreview(data.logo);
        setBannerPreview(data.banner);
      }
      setLoading(false);
    })();
  }, [vendorId]);

  // 2) upload helper
  const uploadImage = async (file: File, folder: string): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${folder}/${fileName}`;
    const { error: upErr } = await supabase.storage
      .from("vendor-assets")
      .upload(filePath, file);
    if (upErr) throw new Error(upErr.message);
    const { data: urlData } = supabase.storage
      .from("vendor-assets")
      .getPublicUrl(filePath);
    if (!urlData.publicUrl) throw new Error("Failed to get public URL");
    return urlData.publicUrl;
  };

  // 3) update profile
  const updateProfile = async (): Promise<boolean> => {
    if (!vendorId) {
      toast.error("Not authenticated");
      return false;
    }
    try {
      let logoUrl = logoPreview;
      let bannerUrl = bannerPreview;
      if (logoFile) logoUrl = await uploadImage(logoFile, "logos");
      if (bannerFile) bannerUrl = await uploadImage(bannerFile, "banners");

      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          description,
          address,
          contact,
          logo: logoUrl,
          banner: bannerUrl,
        })
        .eq("id", vendorId);
      if (error) throw error;
      toast.success("Profile updated!");
      // reflect in-memory
      setLogoFile(null);
      setBannerFile(null);
      setLogoPreview(logoUrl);
      setBannerPreview(bannerUrl);
      return true;
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
      return false;
    }
  };

  // 4) change password
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed!");
      return true;
    } catch (err: any) {
      toast.error("Password update failed: " + err.message);
      return false;
    }
  };

  return {
    loading,
    profile,
    name,
    setName,
    description,
    setDescription,
    address,
    setAddress,
    contact,
    setContact,
    logoPreview,
    setLogoFile,
    setLogoPreview,
    bannerPreview,
    setBannerFile,
    setBannerPreview,
    updateProfile,
    changePassword,
  };
}
