import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CellScope",
  description: "Battery diagnostics tool",
};

import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
