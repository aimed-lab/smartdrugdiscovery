/**
 * Central platform configuration — update version here and it propagates
 * to the sidebar footer, Settings → About, and anywhere else that imports it.
 */
export const PLATFORM_CONFIG = {
  name: "SmartDrugDiscovery",
  /** Semantic version shown in sidebar footer and Settings → About */
  version: "1.141",
  /** Build date (ISO date or human label) */
  build: "2026-04-08",
  /** Edition / license tier */
  license: "Enterprise",
  /** Copyright line */
  copyright: "© 2026 Dr. Jake Y. Chen, UAB Systems Pharmacology AI Research Center. All rights reserved.",
  /** Tech stack badges */
  techStack: [
    "Next.js 14",
    "React 18",
    "TypeScript",
    "Tailwind CSS",
    "Radix UI",
    "Recharts",
    "Vercel",
  ],
} as const;
