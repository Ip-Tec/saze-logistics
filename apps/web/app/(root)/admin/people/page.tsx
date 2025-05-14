"use client";

import { useState, useEffect } from "react";
import { supabaseFE } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "vendor" | "rider";
};

const TABS = ["user", "vendor", "rider"] as const;

export default function PeoplePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("user");

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
      const { data, error } = await supabaseFE
        .from("profiles")
        .select("id,name,email,phone,role")
        .in("role", ["user", "vendor", "rider"])
        .order("name", { ascending: true });

      if (error) setError(error.message);
      else setProfiles(data);
      setLoading(false);
    }
    fetchProfiles();
  }, []);

  if (loading) return <div className="p-4 text-gray-600">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">People</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((roleKey) => {
          const label =
            roleKey === "user"
              ? "Users"
              : roleKey === "vendor"
                ? "Vendors"
                : "Riders";
          return (
            <button
              key={roleKey}
              onClick={() => setTab(roleKey)}
              className={`px-4 py-2 -mb-px font-medium text-sm ${
                tab === roleKey
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Table for current tab */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Email
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Phone
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles
              .filter((p) => p.role === tab)
              .map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-800">{p.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{p.email}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {p.phone ?? "—"}
                  </td>
                </tr>
              ))}
            {profiles.filter((p) => p.role === tab).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  No{" "}
                  {tab === "user"
                    ? "users"
                    : tab === "vendor"
                      ? "vendors"
                      : "riders"}{" "}
                  found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
