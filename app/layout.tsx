import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drop Zone",
  description: "Drop Zone dashboard and admin experience"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
   <html lang="en">
  <body>
    {children}

    <script src="https://plugin-code.salesmartly.com/js/project_817900_847707_1788084399.js"></script>

  </body>
</html>
  );
}

