import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luxe Salon SaaS — Partner Platform for Salon Owners",
  description:
    "Grow your salon business with multi-branch management, smart appointment scheduling, staff commission tracking, real-time analytics, and customer CRM.",
  keywords: [
    "Salon SaaS",
    "Salon Management Software",
    "Salon Owner Registration",
    "Hair Salon Booking System",
    "Beauty Parlour Management App",
    "Multi Branch Salon Software",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
