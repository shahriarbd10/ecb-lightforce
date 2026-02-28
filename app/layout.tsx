import type { Metadata } from "next";
import { Sora, Bebas_Neue } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Providers from "@/app/providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: "ECB Lightforce Academy",
  description: "A football-futsal player hub for discovery and exposure."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${sora.variable} ${bebasNeue.variable}`} suppressHydrationWarning>
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
