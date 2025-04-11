import type { Metadata } from "next";
import "./globals.css";
import "./mockup-styles.css";

export const metadata: Metadata = {
  title: "Chassis ReConnect",
  description: "A local network server connection management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
