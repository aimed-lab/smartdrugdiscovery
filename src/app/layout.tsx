import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthGate } from "./auth-gate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartDrugDiscovery",
  description: "AI-powered drug discovery platform — AIDD 2.0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning prevents React from removing the `dark` class
    // that the theme-init script adds to <html> before hydration completes.
    // Without it, React sees a server/client mismatch and strips the class.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme init — must run synchronously before first paint to avoid flash.
            Reads sdd-theme from localStorage; falls back to OS preference. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sdd-theme');if(t==='dark'){document.documentElement.classList.add('dark');}else if(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
