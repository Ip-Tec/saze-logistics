// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/context/ContextProviders";
import Logo from "@/public/favicon.ico";
import LogoApple from "@/public/apple-touch-icon.png";
import LogoAndroid from "@/public/android-chrome-512x512.png";
import { NotificationProvider } from "@/context/NotificationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "SAZE Logistic, we redefine convenience by connecting Users, Riders, and Vendors through a seamless, easy-to-use delivery platform designed for speed, safety, and satisfaction.",
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
      </body>
    </html>
  );
}
