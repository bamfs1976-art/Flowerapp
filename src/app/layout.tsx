import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FPL War Room — Fantasy Premier League Dashboard",
  description:
    "Your command center for Fantasy Premier League. Manage your squad, analyze transfers, track fixtures, and dominate your mini-league.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased bg-gray-950 text-gray-100">
        {children}
      </body>
    </html>
  );
}
