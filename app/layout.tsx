import type { Metadata } from "next";
import "./globals.css";
import SalesmartlyWidget from "./salesmartly-widget";

export const metadata: Metadata = {
  title: "Ubuy",
  description: "Ubuy seller and admin dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
   <html lang="en">
  <body>
    {children}

    <SalesmartlyWidget />

  </body>
</html>
  );
}

