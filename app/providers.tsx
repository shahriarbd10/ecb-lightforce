"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = window.localStorage.getItem("theme");
    const theme = savedTheme === "dark" ? "dark" : "light";
    root.dataset.theme = theme;
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
