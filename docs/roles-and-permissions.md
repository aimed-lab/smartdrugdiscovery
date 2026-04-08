# Roles and Permissions

SmartDrugDiscovery uses a five-level role hierarchy: **Owner > Admin > TechSupport > Developer > User**. Every authenticated user has exactly one role at a time. Access to the platform is controlled by a **two-gate model**: an invitation token is required to register, and an administrator must approve the new user before they gain full access.

---

## Role Hierarchy

```
Owner  >  Admin  >  TechSupport  >  Developer  >  User
```

Higher roles inherit all permissions of lower roles — an Admin can do everything a Developer or User can do, plus more. The exception is a small set of Owner-exclusive privileges that cannot be delegated.

---

## Role Definitions

### Owner — orange

> Full control: org settings, billing, ownership transfer, platform capacity.

The Owner is the top-level account holder of the platform installation. There is exactly one Owner at any time. The Owner cannot be removed by Admins, and cannot downgrade their own role without completing the [Ownership Transfer](ownership-transfer.md) process. The Owner has unlimited invitation quota and can set the platform capacity limit.

### Admin — red

> Manage users, roles, plugins, models, and the approval queue.

Admins can perform all day-to-day platform administration: approving or rejecting new user registrations, changing other users' roles, suspending or reactivating accounts, revoking access, managing plugin installs, setting the organisation's default model, capping costs, and reviewing the audit log. Admins can create invitations with the **auto-approve** flag, allowing trusted invitees to skip the approval queue. Admins cannot modify org-level settings (name, billing) — only the Owner can.

### TechSupport — teal

> View, triage, and resolve all support tickets.

TechSupport is a cross-cutting role: TechSupport users can view and resolve all support tickets across the platform, but cannot manage billing, user roles, or platform settings. They have the same invitation quota as Developers.

### Developer — blue

> Install and configure MCP servers, view API keys.

Developers are technical users who need access to integration guides, server configuration, and API key visibility. They can view the usage dashboard but cannot change role assignments or uninstall plugins. Developers can invite new users at the Developer or User level.

### User — gray

> Browse, install free plugins, add personal API keys.

The baseline role. Users can explore the platform, view catalogues, install free Tool Plugins using the shared key, bring their own API key for paid plugins or models, and run plugin tests. They cannot make changes that affect other users. Users can invite up to 2 new users at the User level.

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
| `inviteUsers` | User | Create invitation tokens for new users (quotas enforced per role) |
| `manageMembers` | Admin | View all users, approve/reject registrations, change roles, suspend/reactivate |
| `revokeAnyInvitation` | Admin | Revoke any user's pending invitations |
| `setCapacityLimit` | **Owner only** | Adjust the maximum number of active users on the platform |
| `viewAllTickets` | TechSupport | View, triage, and resolve all support tickets |
| `updateTicketStatus` | TechSupport | Change the status of any support ticket |
| `assignTicket` | TechSupport | Assign tickets to team members |
| `deleteTicket` | Admin | Permanently remove a support ticket |

---

## Invitation System

SmartDrugDiscovery uses an **invitation-based growth model** to control who can join the platform. New users cannot self-register; they must receive an invitation token from an existing member.

### Two-Gate Model

1. **Gate 1 — Invitation Token:** A new user must enter a valid, unexpired invitation token on the login page. Without one, registration is blocked.
2. **Gate 2 — Admin Approval:** After registering with a valid token, the new user's account is set to **pending approval**. An Admin or Owner must approve the account before the user can access the platform.

The **auto-approve** bypass (available to Admin and Owner when creating invitations) allows trusted invitees to skip Gate 2 and gain immediate access.

### Invitation Quotas

Each role has a maximum number of active (pending) invitations they can have outstanding at any time:

| Role | Quota |
|---|---|
| Owner | Unlimited |
| Admin | 20 |
| TechSupport | 5 |
| Developer | 5 |
| User | 2 |

### Role Hierarchy Enforcement

Users can only invite at their role level or below. For example:
- An Admin can create invitations for Admin, TechSupport, Developer, or User roles.
- A Developer can only invite Developers or Users.
- A User can only invite other Users.

### Invitation Token Details

- Tokens are 8 characters from the set `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (ambiguous characters I, O, 0, 1 are excluded).
- Tokens expire after **14 days** by default.
- Each token can only be used once.
- Pending tokens can be revoked by the creator or by any Admin.

### Invite Links

When creating an invitation, a shareable link is generated in the format:

```
https://smartdrugdiscovery.org/login?invite=TOKEN
```

Recipients can click this link to land on the login page with the token pre-filled.

### Legacy Bootstrap Token

The token **SPARC2026** is preserved for initial platform bootstrapping. It assigns the **Developer** role with **auto-approve** enabled, meaning SPARC staff can sign in immediately without waiting for admin approval. This token does not expire and can be used by multiple users.

---

## Account Statuses

Every user account has one of four statuses:

| Status | Meaning | Platform Access |
|---|---|---|
| **active** | Fully approved and operational | Full access |
| **pending_approval** | Registered but awaiting admin review | Blocked — sees "Awaiting Approval" screen |
| **rejected** | Registration was declined by an admin | Blocked — sees "Access Not Approved" screen |
| **suspended** | Account temporarily deactivated by an admin | Blocked — sees "Account Suspended" screen |

Only users with `active` status can access the main platform interface (sidebar, pages, tools).

---

## Admin Member Management

Admins and Owners can manage all platform users from **Settings > Members**. The Members panel has four sections:

### 1. Approval Queue

Shows all users with `pending_approval` status. For each pending user, admins can:
- **Adjust the assigned role** before approving (dropdown selector)
- **Approve** — sets the account to `active`, granting full platform access
- **Reject** — sets the account to `rejected`, blocking access

A badge on the tab shows the number of pending approvals.

### 2. Active Members

A table of all users with `active` status. Admins can:
- **Change a user's role** via an inline dropdown (hierarchy-enforced — you cannot assign a role above your own)
- **Suspend** a user via the actions menu (⋯) — temporarily blocks their access
- **Revoke access** via the actions menu (⋯) — permanently blocks their access (sets status to `rejected`)

**Safeguards:**
- You cannot modify your own account from this panel.
- Owner accounts are protected — only the Owner can change Owner-level settings.
- Role changes enforce the hierarchy: an Admin cannot promote someone to Owner.

### 3. Inactive Users

Shows all users with `rejected` or `suspended` status. Admins can:
- **Reactivate** — restores the user to `active` status

### 4. Invitations

Shows all invitations created across the platform (for Admins) or just your own invitations (for non-Admin users). Features include:
- **Create new invitations** with role assignment, optional recipient hint, and auto-approve toggle
- **Copy invite links** for sharing
- **Revoke pending invitations** that haven't been used yet
- View invitation status (pending, accepted, revoked, expired)

### 5. Platform Capacity (Owner Only)

The Owner can set the **maximum number of active users** allowed on the platform. This is useful for controlling growth during testing phases. The default limit is **50 active users**.

A progress bar shows current usage against the capacity limit. New registrations are blocked when capacity is reached, even with valid invitation tokens.

---

## How Admins Change User Roles

1. Navigate to **Settings** (bottom of the left sidebar).
2. Open the **Members** tab.
3. In the **Active Members** table, locate the user.
4. Use the **Role** dropdown in their row to select a new role.
5. The change takes effect immediately.

**Constraints:**
- You can only assign roles at or below your own level (hierarchy enforcement).
- Admins can change the role of any User, Developer, or TechSupport member, but not another Admin or the Owner.
- The Owner can change any user's role except their own (use [Ownership Transfer](ownership-transfer.md) for that).

---

## Visual Role Indicators

Each user's avatar on the platform displays their role through colour coding. The exact tokens are defined in `src/lib/roles.ts`.

### Initials Avatar (default)

When a user's avatar type is **initials** (e.g., "JC"), the avatar circle uses a solid background colour:

| Role | Background colour | Token |
|---|---|---|
| Owner | Orange | `bg-orange-500 text-white` |
| Admin | Red | `bg-red-500 text-white` |
| TechSupport | Teal | `bg-teal-500 text-white` |
| Developer | Blue | `bg-blue-500 text-white` |
| User | Gray | `bg-gray-400 text-white` |

### Emoji or Photo Avatar

When a user's avatar type is **emoji** or **photo**, the avatar gets a coloured glow ring:

| Role | Ring colour | Glow (CSS box-shadow) |
|---|---|---|
| Owner | `ring-orange-500` | `rgba(249, 115, 22, 0.55)` |
| Admin | `ring-red-500` | `rgba(239, 68, 68, 0.55)` |
| TechSupport | `ring-teal-500` | `rgba(20, 184, 166, 0.55)` |
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

---

## localStorage Keys for User Management

| Key | Purpose |
|---|---|
| `sdd-user-db` | All user records (profile, role, account status, invitation metadata) |
| `sdd-auth-user` | Currently authenticated user session |
| `sdd-invitations` | All invitation records (tokens, status, quotas) |
| `sdd-platform-settings` | Platform capacity limit and global settings |
