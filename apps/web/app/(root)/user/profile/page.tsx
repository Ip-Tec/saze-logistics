"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@shared/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";
import ChangePassword from "@/components/auth/ChangePassword";
import type { Database } from "@shared/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrderRow = Database["public"]["Tables"]["order"]["Row"];
type AddressRow = Database["public"]["Tables"]["delivery_address"]["Row"];

export default function UserProfile() {
  const { user: authUser, signOut } = useAuthContext();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch user profile, order history, and saved addresses
  useEffect(() => {
    if (!authUser?.id) return;

    const load = async () => {
      setLoading(true);

      // Fetch profile
      const { data: prof, error: pe } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (pe) console.error("Profile fetch error", pe.message);
      else setProfile(prof);

      // Fetch order history (last 10)
      const { data: ords, error: oe } = await supabase
        .from("order")
        .select("id, vendor_id, created_at, status")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (oe) console.error("Orders fetch error", oe.message);
      else setOrders(ords as OrderRow[]);

      // Fetch saved addresses
      const { data: adds, error: ae } = await supabase
        .from("delivery_address")
        .select("id, street, city, state, postal_code")
        .eq("user_id", authUser.id);

      if (ae) console.error("Addresses fetch error", ae.message);
      else setAddresses(adds as AddressRow[]);

      setLoading(false);
    };

    load();
  }, [authUser?.id]);

  if (loading) return <div className="p-4 text-gray-600">Loading profile…</div>;
  if (!profile)
    return <div className="p-4 text-red-600">Profile not found.</div>;

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 space-y-10">
        {/* Profile Header */}
        <GlassDiv className="flex items-center gap-4">
          <img
            src={
              profile.logo_url ||
              profile.rider_image_url ||
              "/default-avatar.png"
            }
            alt={profile.name}
            className="w-16 h-16 rounded-full border"
          />
          <div>
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <p className="text-gray-500">{profile.email}</p>
          </div>
          <div className="ml-auto">
            <GlassButton
              className="text-sm text-yellow-500 hover:underline"
              onClick={handleEditProfile}
            >
              Edit Profile
            </GlassButton>
          </div>
        </GlassDiv>

        {/* Order History */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Order History</h3>
          {orders.length === 0 ? (
            <p className="text-gray-400">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded-lg cursor-pointer"
                  onClick={() => router.push(`/orders/${o.id}`)}
                >
                  <div>
                    <p className="font-medium">
                      {/* You could fetch vendor name separately if needed */}
                      Order #{o.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(o.created_at!).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      o.status === "Delivered"
                        ? "text-green-500"
                        : "text-red-400"
                    }`}
                  >
                    {o.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Saved Addresses */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Saved Addresses</h3>
          {addresses.length === 0 ? (
            <p className="text-gray-400">No saved addresses.</p>
          ) : (
            <ul className="space-y-2">
              {addresses.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {a.street}, {a.city}
                    </p>
                    <p className="text-sm text-gray-500">
                      {a.state} {a.postal_code}
                    </p>
                  </div>
                  <GlassButton
                    className="text-sm text-yellow-500 hover:underline"
                    onClick={() => router.push(`/profile/addresses/${a.id}`)}
                  >
                    Edit
                  </GlassButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Change Password */}
        <ChangePassword className="mt-10" />

        {/* Logout */}
        <div className="text-center">
          <GlassButton
            className="text-red-500 font-medium hover:underline"
            onClick={handleLogout}
          >
            Logout
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
