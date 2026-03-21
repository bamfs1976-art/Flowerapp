import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Analytics — Bookings, Standings & Insights",
  description:
    "European football analytics focused on player bookings, referee strictness, and team discipline across top leagues.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Football Analytics",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
