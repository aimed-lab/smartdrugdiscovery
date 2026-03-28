/**
 * Module-Level Role-Based Access Control (RBAC)
 *
 * Admins configure per-module visibility for each role.
 * Three access levels:
 *   "full"    — visible and fully functional
 *   "partial" — visible in nav with a 🔒 badge; page shows "restricted" notice
 *   "hidden"  — completely absent from nav (as if the section doesn't exist)
 *
 * Rules:
 *   - Owner is ALWAYS "full" — cannot be restricted.
 *   - Admin is ALWAYS "full" — they manage the config itself.
 *   - TechSupport / Developer / User may be configured freely.
 *   - Default for all roles is "full" unless an admin has changed it.
 */

import { type AppRole } from "@/lib/roles";

export type AccessLevel = "full" | "partial" | "hidden";

/** All configurable module keys in the platform. */
export const MODULE_KEYS = [
  // Nav groups
  "projects",
  "biology",
  "pharmacology",
  "clinical",
  "regulation",
  // Utility nav items
  "design",
  "models",
  "services",
  "plugins",
  "support",
  // Sub-items (group/subKey)
  "projects/directory",
  "projects/team",
  "projects/performance",
  "projects/reports",
  "biology/target-board",
  "biology/mechanisms",
  "biology/perturbation",
  "biology/decisions",
  "pharmacology/candidates",
  "pharmacology/optimization",
  "pharmacology/simulations",
  "pharmacology/decisions",
  "clinical/cohorts",
  "clinical/biomarkers",
  "clinical/trials",
  "clinical/decisions",
  "regulation/irb",
  "regulation/clinical-docs",
  "regulation/licensing",
  "regulation/business",
  "regulation/transactions",
  "regulation/decisions",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

/** Human-readable label for each module key. */
export const MODULE_LABELS: Record<ModuleKey, string> = {
  projects:                    "Projects (group)",
  biology:                     "Biology (group)",
  pharmacology:                "Pharmacology (group)",
  clinical:                    "Clinical (group)",
  regulation:                  "Regulation (group)",
  design:                      "Design with AI",
  models:                      "Foundation Models",
  services:                    "Add-on Service",
  plugins:                     "Tool Plugins",
  support:                     "Support Dashboard",
  "projects/directory":        "Projects → Directory",
  "projects/team":             "Projects → Team",
  "projects/performance":      "Projects → Performance",
  "projects/reports":          "Projects → Reports",
  "biology/target-board":      "Biology → Target Board",
  "biology/mechanisms":        "Biology → Mechanisms of Action",
  "biology/perturbation":      "Biology → Perturbation Simulations",
  "biology/decisions":         "Biology → Decision Reports",
  "pharmacology/candidates":   "Pharmacology → Candidate Molecules",
  "pharmacology/optimization": "Pharmacology → Engineering Optimization",
  "pharmacology/simulations":  "Pharmacology → Model Simulations",
  "pharmacology/decisions":    "Pharmacology → Decision Reports",
  "clinical/cohorts":          "Clinical → Candidate Cohorts",
  "clinical/biomarkers":       "Clinical → Companion Biomarker Opt.",
  "clinical/trials":           "Clinical → Trial Simulations",
  "clinical/decisions":        "Clinical → Decision Reports",
  "regulation/irb":            "Regulation → IRB Protocols",
  "regulation/clinical-docs":  "Regulation → Clinical Trial Documents",
  "regulation/licensing":      "Regulation → Copyright / OSDD2 License",
  "regulation/business":       "Regulation → Business Optimization",
  "regulation/transactions":   "Regulation → Transaction Simulations",
  "regulation/decisions":      "Regulation → Decision Reports",
};

/** Groups to show as sections in the Access Control UI. */
export const MODULE_GROUPS: { label: string; keys: ModuleKey[] }[] = [
  {
    label: "Projects",
    keys: ["projects", "projects/directory", "projects/team", "projects/performance", "projects/reports"],
  },
  {
    label: "Biology",
    keys: ["biology", "biology/target-board", "biology/mechanisms", "biology/perturbation", "biology/decisions"],
  },
  {
    label: "Pharmacology",
    keys: ["pharmacology", "pharmacology/candidates", "pharmacology/optimization", "pharmacology/simulations", "pharmacology/decisions"],
  },
  {
    label: "Clinical",
    keys: ["clinical", "clinical/cohorts", "clinical/biomarkers", "clinical/trials", "clinical/decisions"],
  },
  {
    label: "Regulation",
    keys: ["regulation", "regulation/irb", "regulation/clinical-docs", "regulation/licensing", "regulation/business", "regulation/transactions", "regulation/decisions"],
  },
  {
    label: "Platform Utilities",
    keys: ["design", "models", "services", "plugins", "support"],
  },
];

/** Roles that can be configured (Owner and Admin are always "full"). */
export const CONFIGURABLE_ROLES: AppRole[] = ["TechSupport", "Developer", "User"];

export type ModuleAccessConfig = Partial<Record<ModuleKey, Partial<Record<AppRole, AccessLevel>>>>;

const STORAGE_KEY = "sdd-module-access";

export function loadModuleAccess(): ModuleAccessConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ModuleAccessConfig) : {};
  } catch {
    return {};
  }
}

export function saveModuleAccess(config: ModuleAccessConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

/**
 * Returns the effective access level for a given role + module.
 * Owner and Admin are always "full".
 */
export function getAccess(
  config: ModuleAccessConfig,
  role: AppRole | string | undefined,
  moduleKey: ModuleKey
): AccessLevel {
  const r = (role ?? "User") as AppRole;
  if (r === "Owner" || r === "Admin") return "full";
  return config[moduleKey]?.[r] ?? "full";
}
