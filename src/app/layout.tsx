import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowerapp — Plant & Flower Identifier",
  description:
    "Take a photo of any plant or flower and instantly identify it with AI",
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
