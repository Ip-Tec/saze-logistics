// Remove the import if you previously had it and removed it
// import { withSentryConfig } from "@sentry/nextjs";

import type { NextConfig } from "next";
import { URL } from "url"; // Import URL module to parse the storage URL

// Get the Supabase Storage hostname from the environment variable
// It's safer to get this dynamically if your NEXT_PUBLIC_SUPABASE_URL is in env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Assuming you have this env var
let supabaseHostname = null;
if (supabaseUrl) {
  try {
    const parsedUrl = new URL(supabaseUrl);
    // The storage hostname is typically the same as the Supabase URL hostname
    // but includes '/storage/v1/object/public' in the path in the image src.
    // We only need the hostname part for next.config.js remotePatterns.
    supabaseHostname = parsedUrl.hostname;
  } catch (error) {
    console.error("Failed to parse NEXT_PUBLIC_SUPABASE_URL:", error);
  }
}

// Fallback or direct hostname if not using env var for URL
// You can directly put 'vxcjmhopnllannvtfwze.supabase.co' here if preferred,
// but using the env var is more flexible.
if (!supabaseHostname) {
  // Replace with your actual Supabase project reference if needed,
  // or keep it as a hardcoded string 'vxcjmhopnllannvtfwze.supabase.co'
  // if you are sure it won't change and don't use NEXT_PUBLIC_SUPABASE_URL.
  supabaseHostname = "vxcjmhopnllannvtfwze.supabase.co";
}

const withPWA = require('next-pwa')({
  dest: 'public', // Output directory for the service worker files
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
  // register: true, // Auto-register the service worker (default is true)
  // scope: '/', // Service worker scope (default is '/')
  // sw: 'sw.js', // Name of the service worker file (default is 'sw.js')
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        port: "",
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // For older Next.js versions (before 13.x), you would use 'domains' instead:
    domains: [supabaseHostname, "via.placeholder.com"].filter(Boolean),
  },
};

// Export the nextConfig object directly
export default nextConfig;
