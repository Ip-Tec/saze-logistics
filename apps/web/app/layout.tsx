// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/context/ContextProviders";
import Logo from "@/public/favicon.ico";
import LogoApple from "@/public/apple-touch-icon.png";
import LogoAndroid from "@/public/android-chrome-512x512.png";
import { NotificationProvider } from "@/context/NotificationContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sazee Logistic",
  description:
    "SAZE Logistic, we redefine convenience by connecting Users, Riders, and Vendors through a seamless, easy-to-use delivery platform designed for speed, safety, and satisfaction.",
  // Add the 'icons' property
  icons: {
    icon: Logo.src,
    // Or use an absolute URL:
    // icon: 'https://example.com/favicon.png',
    // You can also specify shortcut, apple, and other icons here:
    shortcut: LogoAndroid.src, // Example for .ico
    apple: LogoApple.src,
    other: {
      rel: "apple-touch-icon-precomposed",
      url: LogoApple.src,
    },
  },

  // PWA Meta Tags
  manifest: "/manifest.json", // Link to your manifest file
  themeColor: "#FF6347", // Theme color for the browser UI
  // Other PWA related meta tags for Apple devices (non-standard but common)
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sazee Logistic", // Short name for Apple devices
  },
  formatDetection: {
    telephone: false, // Prevent phone numbers from being clickable
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover", // For iPhones with notches
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* <script src="https://js.paystack.co/v2/inline.js"></script> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <NotificationProvider>{children}</NotificationProvider>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
