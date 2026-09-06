import type { Metadata, Viewport } from "next";
import "./globals.css";
import SalesmartlyWidget from "./salesmartly-widget";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#071126"
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.udropglobal.com"),
  title: "Udrop - Global Dropshipping Platform",
  description: "Udrop Global Dropshipping Platform",
  icons: {
    icon: "/dropzone-logo.png",
    shortcut: "/dropzone-logo.png",
    apple: "/dropzone-logo.png"
  },
  openGraph: {
    title: "Udrop - Global Dropshipping Platform",
    description: "Udrop Global Dropshipping Platform",
    url: "https://www.udropglobal.com",
    siteName: "Udrop Global",
    images: [
      {
        url: "https://www.udropglobal.com/dropzone-logo.png",
        width: 1200,
        height: 630,
        alt: "Udrop Global Dropshipping Platform"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Udrop - Global Dropshipping Platform",
    description: "Udrop Global Dropshipping Platform",
    images: ["https://www.udropglobal.com/dropzone-logo.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="https://www.udropglobal.com/dropzone-logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image" content="https://www.udropglobal.com/dropzone-logo.png" />
      </head>
      <body>
        {children}
        <SalesmartlyWidget />
      </body>
    </html>
  );
}

