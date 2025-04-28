// Remove the import if you previously had it and removed it
// import { withSentryConfig } from "@sentry/nextjs";

import type { NextConfig } from "next";
import { URL } from "url"; // Import URL module to parse the storage URL

// Get the Supabase Storage hostname from the environment variable
// It's safer to get this dynamically if your SUPABASE_URL is in env variables
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
    console.error("Failed to parse SUPABASE_URL:", error);
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

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Use remotePatterns for Next.js 13 and later
    remotePatterns: [
      {
        protocol: "https", // Or 'http' if you are not using HTTPS (unlikely and not recommended)
        hostname: supabaseHostname, // Use the hostname obtained above
        port: "", // Leave empty unless your Supabase is on a custom port (unlikely)
        pathname: "/storage/v1/object/public/**", // Match the path for public storage objects
      },
      // Add other patterns here if you load images from other external domains
    ],
    // For older Next.js versions (before 13.x), you would use 'domains' instead:
    // domains: [supabaseHostname].filter(Boolean), // Add your Supabase hostname here
  },
};

// Export the nextConfig object directly
export default nextConfig;
