import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drop Zone",
  description: "Drop Zone dashboard and admin experience"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
