# Roles and Permissions

SmartDrugDiscovery uses a four-level role hierarchy that mirrors the GitHub model: **Owner > Admin > Developer > User**. Every authenticated user has exactly one role at a time.

---

## Role Hierarchy

```
Owner  >  Admin  >  Developer  >  User
```

Higher roles inherit all permissions of lower roles — an Admin can do everything a Developer or User can do, plus more. The exception is a small set of Owner-exclusive privileges that cannot be delegated.

---

## Role Definitions

### Owner — orange

> Full control: org settings, billing, ownership transfer.

The Owner is the top-level account holder of the platform installation. There is exactly one Owner at any time. The Owner cannot be removed by Admins, and cannot downgrade their own role without completing the [Ownership Transfer](ownership-transfer.md) process.

### Admin — red

> Manage users, roles, plugins, and models.

Admins can perform all day-to-day platform administration: changing other users' roles, managing plugin installs, setting the organisation's default model, capping costs, and reviewing the audit log. Admins cannot modify org-level settings (name, billing) — only the Owner can.

### Developer — blue

> Install and configure MCP servers, view API keys.

Developers are technical users who need access to integration guides, server configuration, and API key visibility. They can view the usage dashboard but cannot change role assignments or uninstall plugins.

### User — gray

> Browse, install free plugins, add personal API keys.

The baseline role. Users can explore the platform, view catalogues, install free Tool Plugins using the shared key, bring their own API key for paid plugins or models, and run plugin tests. They cannot make changes that affect other users.

---

## Permissions Table

The table below is derived directly from `ROLE_PERMISSIONS` in `src/lib/roles.ts`. "Minimum role" means that role **and above** can perform the action.

| Permission | Minimum Role | Description |
|---|---|---|
| `manageRoles` | Admin | Change other users' platform roles |
| `viewAuditLog` | Admin | View the platform audit/activity log |
| `manageOrgSettings` | **Owner only** | Edit organisation name, branding, platform-level settings |
| `manageBilling` | **Owner only** | Manage subscription, billing details, invoices |
| `viewPluginCatalogue` | User | Browse the Tool Plugins marketplace |
| `installFreePlugin` | User | Install any free MCP plugin from the catalogue |
| `installPaidPlugin` | User | Add a personal API key to install a paid plugin |
| `viewIntegrationGuide` | Developer | Read MCP server integration documentation |
| `configureServer` | Developer | Configure MCP server endpoints and parameters |
| `viewServerAPIKeys` | Developer | View server-side API keys for installed plugins |
| `uninstallPlugin` | Admin | Remove an installed plugin organisation-wide |
| `viewModelCatalogue` | User | Browse the Foundation Models hub |
| `addPersonalAPIKey` | User | Connect a personal Anthropic (or other provider) API key |
| `setOrgDefaultModel` | Admin | Change the default foundation model for the whole org |
| `viewUsageDashboard` | Developer | View model usage statistics and token counts |
| `setCostCap` | Admin | Set or modify spending / token-usage caps |
| `testPlugin` | User | Run the plugin test modal for any installed plugin |

---

## How to Change Your Role

1. Navigate to **Settings** (bottom of the left sidebar).
2. Open the **Profile** tab.
3. In the **Platform Access** section, locate the **Role** selector.
4. Choose a new role from the dropdown.

**Constraints:**
- You can only assign roles you already hold or below (you cannot self-promote).
- Admins can change the role of any User or Developer, but not another Admin or the Owner.
- The Owner cannot change their own role to anything lower without first completing an [Ownership Transfer](ownership-transfer.md).
- A "View as role" toggle is available for demo and testing — it previews the UI as a different role without permanently modifying your account.

---

## Visual Role Indicators

Each user's avatar on the platform displays their role through colour coding. The exact tokens are defined in `src/lib/roles.ts`.

### Initials Avatar (default)

When a user's avatar type is **initials** (e.g., "JC"), the avatar circle uses a solid background colour:

| Role | Background colour | Token |
|---|---|---|
| Owner | Orange | `bg-orange-500 text-white` |
| Admin | Red | `bg-red-500 text-white` |
| Developer | Blue | `bg-blue-500 text-white` |
| User | Gray | `bg-gray-400 text-white` |

### Emoji or Photo Avatar

When a user's avatar type is **emoji** or **photo**, the avatar gets a coloured glow ring:

| Role | Ring colour | Glow (CSS box-shadow) |
|---|---|---|
| Owner | `ring-orange-500` | `rgba(249, 115, 22, 0.55)` |
| Admin | `ring-red-500` | `rgba(239, 68, 68, 0.55)` |
| Developer | `ring-blue-500` | `rgba(59, 130, 246, 0.55)` |
| User | `ring-gray-400` | `rgba(156, 163, 175, 0.45)` |

The `RoleAvatar` component (`src/components/role-avatar.tsx`) handles all avatar rendering and is the single source of truth for these visuals across the sidebar and Settings page.

---

## Owner Role Protection (Critical)

The Owner role is protected by a hard rule enforced in the application logic:

- **An Owner cannot directly downgrade their own role.** The role selector in Settings is disabled for the Owner's own account.
- To relinquish the Owner role, the Owner must complete the [Ownership Transfer](ownership-transfer.md) process, which includes a mandatory 24-hour cooling-off period.
- During the cooling-off period, the current Owner retains all Owner permissions — the transfer is not final until the 24 hours elapse.
- If the transfer is cancelled before the window closes, nothing changes and the Owner retains their role.
- After the 24 hours, the new owner is confirmed automatically: the initiating Owner is demoted to Admin, and the recipient is promoted to Owner.

This design prevents accidental or coerced transfers and gives the current Owner time to reverse the decision.

See [Ownership Transfer](ownership-transfer.md) for the complete step-by-step process.
