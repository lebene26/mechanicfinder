import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "MechanicFinder Ghana - Find Trusted Mechanics Near You",
  description:
    "Connect with skilled, verified mechanics in Accra, Kumasi, and across Ghana. Get instant help for engine repairs, tire services, electrical work, and towing.",
  keywords: [
    "mechanic",
    "Ghana",
    "Accra",
    "Kumasi",
    "car repair",
    "auto service",
    "towing",
    "engine repair",
  ],
  authors: [{ name: "MechanicFinder Ghana" }],
  openGraph: {
    title: "MechanicFinder Ghana - Find Trusted Mechanics Near You",
    description:
      "Connect with skilled, verified mechanics in Accra, Kumasi, and across Ghana.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
