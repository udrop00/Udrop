import type { Metadata } from "next";
import "./globals.css";
import SalesmartlyWidget from "./salesmartly-widget";

export const metadata: Metadata = {
  title: "Udrop",
  description: "Udrop seller and admin platform"
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

