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
    <html lang="en">
      {/* Theme initializer — runs before React hydration to prevent flash */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sdd-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
