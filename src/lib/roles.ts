// ── Role definitions ─────────────────────────────────────────────────────────
// Mirrors GitHub's role hierarchy: Owner > Admin > Developer > User

export type AppRole = "Owner" | "Admin" | "Developer" | "User";

export const ROLE_ORDER: AppRole[] = ["Owner", "Admin", "Developer", "User"];

export function roleRank(role: AppRole): number {
  return ROLE_ORDER.indexOf(role);
}

/** True if `userRole` meets or exceeds `required`. */
export function hasRole(userRole: AppRole | string | undefined, required: AppRole): boolean {
  const ur = (userRole ?? "User") as AppRole;
  return roleRank(ur) <= roleRank(required);
}

// ── Permission map ────────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS = {
  // Org / platform
  manageRoles:          "Admin",   // change other users' roles
  viewAuditLog:         "Admin",
  manageOrgSettings:    "Owner",
  manageBilling:        "Owner",

  // Plugins / MCP
  viewPluginCatalogue:  "User",    // everyone sees the catalogue
  installFreePlugin:    "User",    // any user can install a free plugin
  installPaidPlugin:    "User",    // users can add their own API key for paid plugins
  viewIntegrationGuide: "Developer",
  configureServer:      "Developer",
  viewServerAPIKeys:    "Developer",
  uninstallPlugin:      "Admin",

  // Models
  viewModelCatalogue:   "User",
  addPersonalAPIKey:    "User",
  setOrgDefaultModel:   "Admin",
  viewUsageDashboard:   "Developer",
  setCostCap:           "Admin",

  // Testing
  testPlugin:           "User",    // all roles can run the test modal
} as const satisfies Record<string, AppRole>;

export type Permission = keyof typeof ROLE_PERMISSIONS;

export function can(userRole: AppRole | string | undefined, permission: Permission): boolean {
  const required = ROLE_PERMISSIONS[permission] as AppRole;
  return hasRole(userRole, required);
}

// ── Role metadata ─────────────────────────────────────────────────────────────

export const ROLE_META: Record<AppRole, { label: string; color: string; description: string }> = {
  Owner: {
    label: "Owner",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    description: "Full control — org settings, billing, transfer",
  },
  Admin: {
    label: "Admin",
    color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    description: "Manage users, roles, plugins, and models",
  },
  Developer: {
    label: "Developer",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    description: "Install and configure MCP servers, view API keys",
  },
  User: {
    label: "User",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    description: "Browse, install free plugins, add personal API keys",
  },
};
