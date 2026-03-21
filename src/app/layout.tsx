import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Analytics — Bookings, Standings & Insights",
  description:
    "European football analytics focused on player bookings, referee strictness, and team discipline across top leagues.",
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
