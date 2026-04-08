# Platform Architecture

This document describes the technical architecture of SmartDrugDiscovery: the technology stack, persistence model, key source files, API surface, and external integrations.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI library | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Component primitives | Radix UI |
| Charts | Recharts |
| Deployment | Vercel |

The single source of truth for the tech stack list is `src/lib/platform-config.ts` (`PLATFORM_CONFIG.techStack`). The sidebar footer and Settings → About tab both read from this constant.

---

## Persistence Model

### Current: localStorage + Vercel environment variables

SmartDrugDiscovery currently uses **client-side localStorage** for user data persistence. All profile fields (name, email, title, institution, avatar, role, social links) are serialised to a JSON blob and stored in the browser under the key `sdd-user-db`. Session state (the currently authenticated user) is stored under `sdd-auth-user`.

This means:
- User data is per-browser, per-device.
- Clearing browser storage logs the user out and resets their profile.
- No cross-device sync is available in the current version.

#### localStorage Keys

| Key | Purpose |
|---|---|
| `sdd-user-db` | All user records (profile, role, account status, invitation metadata) |
| `sdd-auth-user` | Currently authenticated user session |
| `sdd-api-keys` | User API keys (Anthropic, Groq, OpenAI, etc.) |
| `sdd-theme` | Dark/light mode preference |
| `sdd-office-connections` | Office 365 tool connection states |
| `sdd-module-access` | Admin-configured module access control matrix |
| `sdd-plugin-installs` | Set of installed plugin IDs |
| `sdd-nav-expanded` | Sidebar navigation expanded/collapsed state |
| `sdd-invitations` | All invitation records (tokens, status, quotas) |
| `sdd-platform-settings` | Platform capacity limit and global settings |

**Server-side secrets** (GitHub token, Anthropic API key, feedback read key) are stored as Vercel environment variables and never exposed to the client.

### Future: Supabase / Prisma + PlanetScale

The `saveUserToDB` hook in `src/lib/auth-context.tsx` is the designated integration point for a server-side database. The planned migration path replaces localStorage persistence with a Supabase database (or Prisma ORM connected to PlanetScale), enabling:

- Cross-device profile sync
- Server-authoritative role management
- Real audit log persistence
- Organisation-scoped user tables

Until that migration occurs, all user data remains client-local.

---

## Key Source Files

### Application Shell

| File | Purpose |
|---|---|
| `src/app/auth-gate.tsx` | Top-level auth wrapper; renders `LoginPage` or the main layout with `Sidebar`, nav groups, and `RoleAvatar`. Wraps the authenticated layout in `AccountStatusGate` to enforce account status checks. Also mounts `FeedbackWidget`. |
| `src/components/role-avatar.tsx` | Shared avatar component used in sidebar header and Settings profile. Applies `ROLE_AVATAR_BG` or `ROLE_RING`/`ROLE_GLOW` based on avatar type. |
| `src/components/pending-approval-screen.tsx` | `AccountStatusGate` component and status screens (pending approval, rejected, suspended). Gates platform access based on `user.accountStatus`. |
| `src/components/members-panel.tsx` | Admin member management panel: approval queue, active members table with role selectors and action menus, inactive users list, invitation management, and platform capacity controls. |

### Core Libraries

| File | Purpose |
|---|---|
| `src/lib/auth-context.tsx` | `AuthProvider` and `useAuth` hook. Defines the `User` interface (including `accountStatus`, `invitedBy`, `approvedBy` fields), localStorage persistence, login/logout, `updateUser`, and admin functions (`getAllUsers`, `approveUser`, `rejectUser`, `suspendUser`, `reactivateUser`, `updateUserRole`). Login flow validates invitation tokens for new users and checks account status for returning users. |
| `src/lib/roles.ts` | All RBAC types and logic: `AppRole`, `ROLE_ORDER`, `roleRank`, `hasRole`, `can`, `ROLE_PERMISSIONS`, `ROLE_AVATAR_BG`, `ROLE_RING`, `ROLE_GLOW`, `ROLE_META`. Single source of truth for permissions. Includes invitation and member management permissions. |
| `src/lib/invitations.ts` | Invitation engine: token generation, creation, validation, redemption, revocation, quota enforcement, and platform capacity settings. Handles the SPARC2026 legacy token as a synthetic invitation. |
| `src/lib/platform-config.ts` | `PLATFORM_CONFIG` constant: platform name, version number, build date, license tier, copyright string, and tech stack array. Update version here — it propagates to sidebar footer and Settings → About. |

### Page Routes

| File | Route | Purpose |
|---|---|---|
| `src/app/settings/page.tsx` | `/settings` | Multi-tab settings page: Profile, API Keys, Preferences, Data, Privacy & Legal, About, Members (Admin+), Access Control (Admin+) |
| `src/app/models/page.tsx` | `/models` | Foundation Models hub — connect API keys, browse available models |
| `src/app/plugins/page.tsx` | `/plugins` | Tool Plugins marketplace — browse, install, configure, test MCP plugins |
| `src/app/services/page.tsx` | `/services` | Add-on Services and Office Tools catalogue |
| `src/app/projects/page.tsx` | `/projects` | Projects workspace — Overview, Kanban, Timeline, Team, and Assets views |
| `src/app/design/page.tsx` | `/design` | Design with AI — generative design tools |

---

## Navigation Structure

The sidebar (defined in `src/app/auth-gate.tsx`) groups navigation items into four scientific domains plus platform utilities:

| Domain | Icon | Examples of sub-pages |
|---|---|---|
| Biology | `Dna` | Target identification, gene/protein analysis |
| Pharmacology | `FlaskConical` | ADMET, bioactivity, compound screening |
| Clinical | `Stethoscope` | Trial data, clinical endpoints |
| Regulation | `ShieldCheck` | Regulatory pathways, compliance tools |
| Projects | `FolderOpen` | Multi-view project management workspace |
| Design with AI | `Sparkles` | Generative design interface |
| Foundation Models | `BrainCircuit` | Model hub and API key management |
| Add-on Services | `Package` | Extended service integrations |
| Tool Plugins | `Puzzle` | MCP plugin marketplace |

---

## MCP Integrations

SmartDrugDiscovery connects to external scientific data sources through MCP (Model Context Protocol) servers. The following integrations are available in the Tool Plugins catalogue:

| Integration | Data source | Key capabilities |
|---|---|---|
| ChEMBL | EMBL-EBI ChEMBL database | Compound search, bioactivity, mechanism of action, ADMET |
| PubMed | NCBI PubMed | Article search, metadata, full-text retrieval, citation lookup |
| Talent KG | UAB Talent Knowledge Graph | Researcher profiles, collaboration networks |
| HuggingFace | HuggingFace Hub | Model discovery, dataset access |
| Kaggle | Kaggle datasets and competitions | Dataset search and download |

Each MCP server is configured through the **Tool Plugins** page (`/plugins`). Developer-role users and above can view integration guides and configure server endpoints. Admin-role users can uninstall plugins organisation-wide.

---

## API Routes

All internal API routes are Next.js Route Handlers located under `src/app/api/`. See [API Reference](api-reference.md) for full specifications.

| Route | Method(s) | Purpose |
|---|---|---|
| `/api/assistant` | POST, GET | Platform AI assistant (multi-provider: Anthropic, OpenAI, Gemini, DeepSeek, Groq, Perplexity, Kimi, GLM). POST sends a question; GET is a health check. User must supply their own API key. |
| `/api/feedback` | POST, GET | Submit feedback; list the feedback log |
| `/api/admin/issues` | GET | Merged GitHub Issues + local feedback log for admin console |
| `/api/admin/analyze` | POST | Claude-powered analysis of a file and issue; returns proposed code changes |
| `/api/admin/commit` | POST | Commit AI-proposed file changes to GitHub via the Contents API |
| `/api/search` | GET | Internal search route |

---

## Versioning

- Version numbers follow the format `1.xxx` (e.g., `1.100`).
- Each logical push to `main` increments the version counter.
- Git tags follow the pattern `v1.xxx`.
- The current version is stored in `PLATFORM_CONFIG.version` in `src/lib/platform-config.ts`.
- Release notes for every version are in [`RELEASES.md`](../RELEASES.md) at the repository root.

To inspect or roll back to a specific version:

```bash
git checkout v1.100   # inspect
git revert HEAD       # revert latest commit (preferred over reset)
```

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `/api/admin/analyze` | Server-side Claude API calls for admin AI analysis only |
| `GITHUB_TOKEN` | `/api/feedback`, `/api/admin/*` | GitHub Issues API and Contents API |
| `GITHUB_OWNER` | `/api/feedback`, `/api/admin/*` | GitHub repository owner (org or user) |
| `GITHUB_REPO` | `/api/feedback`, `/api/admin/*` | GitHub repository name |
| `FEEDBACK_READ_KEY` | `/api/feedback` (GET) | Simple bearer key to protect the feedback read endpoint |

All variables are set in the Vercel project dashboard or in a local `.env.local` file during development.

> **Note:** The `/api/assistant` route no longer uses a server-side API key. Users must configure their own API key in Settings → API Keys. The assistant supports 8 providers: Anthropic, OpenAI, Google Gemini, DeepSeek, Groq, Perplexity, Kimi (Moonshot), and GLM (Zhipu AI).
