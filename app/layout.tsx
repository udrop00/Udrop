import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
  title: "Udrop - Global Marketplace",
  description: "Udrop Global Marketplace",
  icons: {
    icon: "/dropzone-logo.png",
    shortcut: "/dropzone-logo.png",
    apple: "/dropzone-logo.png"
  },
  openGraph: {
    title: "Udrop - Global Marketplace",
    description: "Udrop Global Marketplace",
    url: "https://www.udropglobal.com",
    siteName: "Udrop Global",
    images: [
      {
        url: "https://www.udropglobal.com/og-marketplace.png",
        width: 1200,
        height: 630,
        alt: "Udrop Global Marketplace"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Udrop - Global Marketplace",
    description: "Udrop Global Marketplace",
    images: ["https://www.udropglobal.com/og-marketplace.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="https://www.udropglobal.com/og-marketplace.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image" content="https://www.udropglobal.com/og-marketplace.png" />
      </head>
      <body>
        <Script
          id="salesmartly-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.ssq = window.ssq || [];`
          }}
        />
        <Script
          id="salesmartly-widget-script"
          src="https://plugin-code.salesmartly.com/js/project_822568_852939_1788610045.js"
          strategy="afterInteractive"
        />
        {children}
        <SalesmartlyWidget />
      </body>
    </html>
  );
}

