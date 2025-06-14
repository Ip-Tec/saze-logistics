// app/(root)/rider/layout.tsx
"use client";

import React, { useEffect } from "react";
import { supabase } from "@shared/supabaseClient";
import GlassComponent from "@/components/ui/glass";
import RiderSidebar from "@/components/rider/RiderSidebar";
import { ShieldCheck, HeartPulse, HardHat } from "lucide-react";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    let watcher: number;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      // start watching position
      watcher = navigator.geolocation.watchPosition(
        async ({ coords }) => {
          await supabase.from("rider_location").insert({
            rider_id: user.id,
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        },
        (err) => console.error("Geo watch error", err),
        { enableHighAccuracy: true, maximumAge: 5000 } as PositionOptions & {
          distanceFilter: number;
        }
      );
    });
    return () => {
      if (watcher !== undefined) navigator.geolocation.clearWatch(watcher);
    };
  }, []);

  return (
    <div className="md:p-0 h-full w-full bg-gradient-to-br from-blue-100 via-gray-50 to-green-50 flex items-center justify-center relative !overflow-hidden">
      {/* Winding road path with 3 bends */}
      {/* Sample SVG tree (simplified) */}
      <svg
        className="absolute left-10 top-1/3 w-8 h-8 z-10"
        viewBox="0 0 24 24"
        fill="green"
      >
        <path
          className="!-z-40"
          d="M12 2C10.34 2 9 3.34 9 5v1H6v2h3v2H5v2h4v3h2v4h2v-4h2v-3h4v-2h-4V8h3V6h-3V5c0-1.66-1.34-3-3-3z"
        />

        <path
          d="M-10 50 Q 20 30 40 70 Q 60 30 80 50 Q 90 70 110 50"
          strokeWidth="20"
          fill="none"
          stroke="#1f2937" // Tailwind gray-800
          opacity="0.2"
        />
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Animated road elements */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-gray-700 opacity-10"
          style={{
            maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-10 50 Q 20 30 40 70 Q 60 30 80 50 Q 90 70 110 50' stroke='black' stroke-width='8' fill='none'/%3E%3C/svg%3E")`,
          }}
        />

        <div
          className="absolute inset-0 bg-[length:20px_40px] bg-gradient-to-b from-transparent 45%, to-yellow-400 45% 55%, transparent 55% animate-road-line"
          style={{
            maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-10 50 Q 20 30 40 70 Q 60 30 80 50 Q 90 70 110 50' stroke='black' stroke-width='4' fill='none'/%3E%3C/svg%3E")`,
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-10 50 Q 20 30 40 70 Q 60 30 80 50 Q 90 70 110 50' stroke='black' stroke-width='4' fill='none'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Health/Safety elements */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <div className="p-2 bg-green-500 rounded-full shadow-lg text-white">
          <ShieldCheck size={20} />
        </div>
        <div className="p-2 bg-yellow-400 rounded-full shadow-lg text-white">
          <HeartPulse size={20} />
        </div>
        <div className="p-2 bg-blue-500 rounded-full shadow-lg text-white">
          <HardHat size={20} />
        </div>
      </div>

      <GlassComponent className="!m-0 !w-full !h-full">
        <div className="md:flex w-full h-full p-0 m-0">
          <RiderSidebar />
          <main className="flex p-4 w-full overflow-y-auto">{children}</main>
        </div>
      </GlassComponent>
    </div>
  );
}
