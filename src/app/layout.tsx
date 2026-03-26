import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartDrugDiscovery",
  description: "AI-powered drug discovery platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 px-3 py-4 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">SD</span>
        </div>
        <span className="font-semibold text-lg">SmartDrug</span>
      </div>
      <NavItem href="/" label="Dashboard" />
      <NavItem href="/projects" label="Projects" />
      <NavItem href="/compounds" label="Compounds" />
      <NavItem href="/targets" label="Targets" />
      <NavItem href="/experiments" label="Experiments" />
      <NavItem href="/search" label="Search ChEMBL" />
      <NavItem href="/analysis" label="Analysis with AI" />
      <NavItem href="/services" label="Services" />
      <div className="mt-auto pt-4 border-t">
        <NavItem href="/settings" label="Settings" />
      </div>
    </aside>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {label}
    </a>
  );
}
