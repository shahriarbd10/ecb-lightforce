import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "ECB Lightforce Academy",
  description: "A football-futsal player hub for discovery and exposure."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
