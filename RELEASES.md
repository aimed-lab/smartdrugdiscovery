# SmartDrugDiscovery — Release Notes

Versioning format: **1.xxx** (increment on each logical push to `main`).
Tags follow `v1.xxx` in git. Stable releases are marked ⭐.

> **Agentic coding discipline:**
> Every user-visible change gets its own tag. This lets you `git checkout vX.YYY` to inspect, verify, or roll back any individual change without touching a full major release. See the [Developer Guide](#developer-guide) at the bottom for rollback and cherry-pick recipes.

---

## v1.118 — Plugins: SmartDrugDiscovery for Chrome + PowerPoint
**Date:** 2026-03-28
**Tag:** `v1.118`
**Commit:** `ccbeb82`
**Status:** Stable ⭐

Two first-party integrations reserved for upcoming platform extensions:

| Plugin | Type | Status | Purpose |
|--------|------|--------|---------|
| SmartDrugDiscovery for Chrome | Source (browser ext) | v0.9 beta | One-click data clipping from PubMed/ChEMBL/ClinicalTrials into projects |
| SmartDrugDiscovery for PowerPoint | Source (Office add-in) | v0.8 beta | Generate slide decks: compound dashboards, A1-A10 heatmaps, survival curves |

Both are Enterprise license, free tier, compatible with all models. Test modal steps included.

### Files Changed
| File | Change type |
|------|------------|
| `src/app/plugins/page.tsx` | Modified (2 new plugin entries) |

### Rollback
```bash
git checkout v1.117
```

---

## v1.117 — Design Page Chat: Wired to Real Anthropic API
**Date:** 2026-03-28
**Tag:** `v1.117`
**Commit:** `1632dfe`
**Status:** Stable ⭐

### Root cause
`handleSend()` used a hardcoded `setTimeout` returning a canned placeholder string. It never called the Anthropic API, regardless of whether `ANTHROPIC_API_KEY` was configured.

### Fix
- `handleSend()` is now `async`, calls `POST /api/assistant` with the question, page context (DMBT + selected model), and last-6 message history
- `isThinking` state drives an animated 3-dot indicator below the chat
- Textarea and Send button disabled while waiting for response
- Network errors shown as an assistant message (graceful fallback)
- Canned placeholder removed entirely

### Files Changed
| File | Change type |
|------|------------|
| `src/app/design/page.tsx` | Modified (async handleSend, isThinking state, real API call) |

### Rollback
```bash
git checkout v1.116
```

---

## v1.116 — Office Tools: Real OAuth Popup Flow + Test/Disconnect
**Date:** 2026-03-28
**Tag:** `v1.116`
**Commit:** `4d21e26`
**Status:** Stable ⭐

### Features
- **OAuth tools** (Notion, Google Drive, OneDrive, BOX, Gmail, Calendar, read.ai): clicking "Connect via OAuth 2.0" opens a branded consent popup at `/api/oauth-popup`
- Popup sends `postMessage` to opener on Authorize; parent marks tool connected
- Popup closed without action → state resets to disconnected (500ms interval check)
- **API-key tools** (Zapier): inline key input with show/hide, Save & Connect
- **Embed tools** (YouTube): single Enable Embed button (no auth)
- **Connected state**: green badge, account email, Test Connection + Disconnect buttons
- Test Connection: 1.4s simulated test, 90% success, timestamps last test
- Error state: Retry Test + Disconnect
- All connection state persisted to `localStorage` (key: `sdd-office-connections`)

### Files Changed
| File | Change type |
|------|------------|
| `src/app/services/page.tsx` | Modified (OfficeToolsSection rewritten) |
| `src/app/api/oauth-popup/route.ts` | Created (self-contained HTML consent page) |

### Rollback
```bash
git checkout v1.115
```

---

## v1.115 — Feedback Ticketing System + TechSupport Role
**Date:** 2026-03-28
**Tag:** `v1.115`
**Commit:** `5d946c2`
**Status:** Stable ⭐

### New Role: TechSupport
| Attribute | Value |
|-----------|-------|
| Color | Teal — `bg-teal-500` / `ring-teal-500` |
| Permissions | `viewAllTickets`, `updateTicketStatus`, `assignTicket`; cannot manage billing or org settings |
| Nav visibility | Support Dashboard link shown in sidebar for TechSupport+ roles |

### Ticketing system
- `FeedbackEntry` extended with `status` (open/in-progress/resolved/closed/wont-fix), `assignedTo`, `resolvedAt`, `resolution`
- `/api/feedback` extended with `PATCH` (update status/assignee/resolution) and `DELETE` (Admin+)
- Ticket types expanded: `bug | enhancement | idea | question | praise`

### Support Dashboard (`/support`)
- Summary cards: Open / In Progress / Resolved / P0 Critical
- Ticket list with priority/status color badges, assignee, one-click delete (Admin+)
- Detail panel: status selector, assignee email, resolution note save
- Seed demo tickets shown when `feedback-log.json` is empty

### Feedback widget improvements
- Type selector replaced with compact emoji pill chips (🐛 Bug · ✨ Enhancement · 💡 Idea · ❓ Question · 🌟 Praise)
- Title field is the primary field (required); details/priority/attachments collapsed by default under `<details>` element
- Dramatically reduces clicks-to-submit for simple reports

### Files Changed
| File | Change type |
|------|------------|
| `src/lib/roles.ts` | Modified (TechSupport role + 4 new permissions) |
| `src/app/api/feedback/route.ts` | Modified (status/assign/resolve fields, PATCH, DELETE) |
| `src/app/support/page.tsx` | Created (Tech Support Dashboard) |
| `src/components/feedback-widget.tsx` | Modified (quick-submit form, new types) |
| `src/app/auth-gate.tsx` | Modified (Support Dashboard nav item, Headset icon) |

### Rollback
```bash
git checkout v1.114
```

---

## v1.113 — docs/: Platform Documentation Directory
**Date:** 2026-03-28
**Tag:** `v1.113`
**Commit:** `835a9da`
**Status:** Stable

Six Markdown files added to `docs/` for GitHub-hosted platform documentation, linked from the AI assistant Docs tab and the feedback widget.

| File | Contents |
|------|----------|
| `docs/README.md` | Index with links to all docs pages |
| `docs/roles-and-permissions.md` | Owner/Admin/Developer/User RBAC rules, permission matrix |
| `docs/ownership-transfer.md` | 24-hr cooling-off protocol, cancel/complete flow, edge cases |
| `docs/platform-architecture.md` | Tech stack, localStorage persistence, MCP servers, AI models |
| `docs/getting-started.md` | Invite code login, first-time walkthrough, key concepts |
| `docs/api-reference.md` | `/api/assistant` spec, planned endpoints, auth patterns |

### Rollback
```bash
git checkout v1.112
```

---

## v1.112 — AI Assistant Widget: Tabbed Ask AI / Feedback / Docs
**Date:** 2026-03-28
**Tag:** `v1.112`
**Commit:** `785cc23`
**Status:** Stable

The floating feedback button is now a full AI assistant panel with three tabs.

### Features
- **Ask AI tab**: Chat UI with starter question chips, conversation history, thinking animation
- **Rate limiting**: Free tier (User role) = 5 questions/session; Owner/Admin/Developer = unlimited
- **Feedback tab**: Original form preserved (type, priority, summary, details, file attachments)
- **Docs tab**: Quick links to GitHub docs pages + "Ask the assistant" CTA
- Float button icon changed from `MessageSquarePlus` to `Bot`
- `/api/assistant` route: `claude-sonnet-4-5`, 600 max tokens, last-6 message history window, graceful error fallback

### Files Changed
| File | Change type |
|------|------------|
| `src/components/feedback-widget.tsx` | Rewritten (3-tab assistant panel) |
| `src/app/api/assistant/route.ts` | Created (Anthropic API proxy with system prompt) |

### Rollback
```bash
git checkout v1.111
```

---

## v1.111 — Settings: Owner Lock Panel, Transfer UI, API Keys Split
**Date:** 2026-03-28
**Tag:** `v1.111`
**Commit:** `c53b927`
**Status:** Stable

### Changes
- **Owner role lock**: Role select replaced with orange locked panel; Owner cannot self-demote
- **Ownership transfer wizard**: Enter recipient email → confirm dialog → 24-hr countdown → Cancel button
- **API Keys page**: Split into "AI Model Providers" (Anthropic/env, Groq, OpenAI) and "Data Sources"; Anthropic key shown as server env var with Foundation Model badge link
- **About tab**: All values now read from `PLATFORM_CONFIG` (no more hardcoded strings)
- Save confirmation banner persists org email, LinkedIn, X, ORCID fields

### Files Changed
| File | Change type |
|------|------------|
| `src/app/settings/page.tsx` | Modified (owner UI, transfer wizard, API key split) |

### Rollback
```bash
git checkout v1.110
```

---

## v1.110 — Owner Role Protection: 24-hr Ownership Transfer
**Date:** 2026-03-28
**Tag:** `v1.110`
**Commit:** `7e84f16`
**Status:** Stable

### Rule
An Owner cannot downgrade their own role. To transfer ownership:
1. Owner nominates a recipient email in Settings → Profile → Transfer Ownership
2. A 24-hour cooling-off period begins (cancellable during this window)
3. After 24 hr the transfer auto-completes; the previous Owner becomes Admin

### Implementation
- `User` interface extended with `pendingOwnerTransfer?: { toEmail: string; initiatedAt: string }`
- `initiateOwnerTransfer(toEmail)` added to `AuthContext`
- `cancelOwnerTransfer()` added to `AuthContext`
- Both functions persist changes via `saveUserToDB` → localStorage

### Files Changed
| File | Change type |
|------|------------|
| `src/lib/auth-context.tsx` | Modified (pendingOwnerTransfer type + two new methods) |

### Rollback
```bash
git checkout v1.109
```

---

## v1.108 — Fix: Profile Fields Now Persist Correctly (localStorage)
**Date:** 2026-03-28
**Tag:** `v1.108`
**Commit:** `da1d1e2`
**Status:** Stable

### Bug Fix

**Root cause:** `linkedin`, `twitter`, `orcid`, `orgEmail`, and `orgEmailVerified` were local
`useState` fields in the Settings page but were never included in the `updateUser()` call
or the `User` interface — so they silently discarded on every Save or page reload.

#### `src/lib/auth-context.tsx`
- Added to `User` interface (all optional, all persisted via `saveUserToDB` → localStorage):
  - `orgEmail?: string`
  - `orgEmailVerified?: boolean`
  - `linkedin?: string`
  - `twitter?: string`
  - `orcid?: string`

#### `src/app/settings/page.tsx`
- `useEffect` now reads all 5 new fields from `user` on initial mount
- `profileLoaded` ref prevents re-hydration when `updateUser()` mutates `user` mid-editing
- `handleVerifyOrgCode`: calls `updateUser({ orgEmail, orgEmailVerified: true })` immediately on OTP success — survives page reload
- Verified org email state restored from `user.orgEmailVerified` on remount
- **Save Profile** button includes all fields in `updateUser()` payload
- Green **"✓ Profile saved"** confirmation banner (4-second auto-dismiss) appears after save
- Note in banner: _"persisted in your browser — a server DB can be connected later"_

### Persistence architecture (current)
| Layer | Technology | Notes |
|-------|-----------|-------|
| Client state | React `useState` | In-memory, lost on navigation |
| Local persistence | `localStorage` (JSON) | Survives page reload / browser close |
| Server DB | **Not yet implemented** | Supabase / Prisma would replace localStorage |

> **Next step for a real backend:** Replace `saveUserToDB` / `getUserDB` in `auth-context.tsx`
> with `fetch('/api/user', { method: 'PATCH', body: JSON.stringify(updates) })` and back it
> with a Supabase or Prisma-managed Postgres database.

### Files Changed
| File | Change type |
|------|------------|
| `src/lib/auth-context.tsx` | Modified (5 new User fields) |
| `src/app/settings/page.tsx` | Modified (load/save all fields, save confirmation) |

### Rollback
```bash
git checkout v1.107
```

---

## v1.106 — Synchronized Role-Color Avatar, Emoji/Photo Support, Models Button Alignment
**Date:** 2026-03-28
**Tag:** `v1.106`
**Commit:** `ceacc5a`
**Status:** Stable

### New Features

#### `src/lib/roles.ts` (EXTENDED — single source of truth for avatar colors)
- `ROLE_AVATAR_BG` — solid Tailwind bg+text classes for initials mode (orange/red/blue/gray)
- `ROLE_RING` — Tailwind `ring-*` class for emoji/photo ring outline
- `ROLE_GLOW` — CSS rgba value for `box-shadow` glow matching ring color at 55% opacity

#### `src/lib/auth-context.tsx` (User interface extended)
- `avatarType?: "initials" | "emoji" | "photo"` — controls rendering mode
- `avatarPhoto?: string` — base64 JPEG data URL for photo mode
- Both fields persisted to localStorage user DB

#### `src/components/role-avatar.tsx` (NEW shared component)
- Sizes: `sm` (sidebar, 32px) · `md` (medium, 56px) · `lg` (settings header, 80px)
- **initials**: solid `ROLE_AVATAR_BG` background — unchanged look
- **emoji**: neutral `bg-muted` + `ring-2 ROLE_RING` + CSS glow box-shadow
- **photo**: circular `<img>` + same ring + glow
- Used in **sidebar footer** and **Settings → Profile header** → always synchronized

#### Settings → Profile — avatar editor (`src/app/settings/page.tsx`)
- **Upload photo** → resized to 200×200 JPEG via Canvas API, stored as base64
- **Emoji field** → type/paste any emoji, press Enter or click "Use"
- **Use initials** → reset to auto-generated initials from name
- Role badge shown inline next to name

#### Models Catalogue — button alignment (`src/app/models/page.tsx`)
- `<Card>` gets `flex flex-col` — cards in same row stretch to equal height
- `<CardContent>` gets `flex flex-col flex-1`
- Actions `<div>` gets `mt-auto` → **Install Locally / Add API Key / Set as Active** button always pinned to card bottom

### Files Changed
| File | Change type |
|------|------------|
| `src/lib/roles.ts` | Modified (added ROLE_AVATAR_BG, ROLE_RING, ROLE_GLOW) |
| `src/lib/auth-context.tsx` | Modified (avatarType, avatarPhoto fields) |
| `src/components/role-avatar.tsx` | **Created** |
| `src/app/auth-gate.tsx` | Modified (RoleAvatar, AppRole import) |
| `src/app/settings/page.tsx` | Modified (avatar editor, RoleAvatar header) |
| `src/app/models/page.tsx` | Modified (flex card layout, mt-auto button) |

### Rollback
```bash
git checkout v1.105
```

---

## v1.104 — Tool Plugins: Hugging Face Hub + Kaggle Connectors
**Date:** 2026-03-28
**Tag:** `v1.104`
**Commit:** `380ef1e`
**Status:** Stable

### New Features

#### `src/app/plugins/page.tsx`
- **Hugging Face Hub** (API · freemium · requires HF token)
  - Access 500,000+ models: ESM-2, BioGPT, ChemBERTa, MolBERT, and more
  - HF Inference API for embedding generation + zero-shot inference without local GPU
  - Dataset search for molecular generation (ZINC-250k, ChEMBL-30, MOSES, QM9)
  - Category: Foundation Models | FAIR: all ✓
  - Test steps: `model_info`, protein embedding inference, `dataset_search`
- **Kaggle Datasets & Notebooks** (API · free · requires Kaggle API key)
  - GDSC2 (1,001 cell lines × 298 drugs), CCLE (1,457 lines), NCI-60 drug sensitivity data
  - Community notebooks: search by topic + vote count (e.g. BRAF ML predictor, XGBoost AUC 0.87)
  - Category: Datasets | FAIR: F/A/I ✓, Reusable varies by dataset license
  - Test steps: `dataset_search`, `dataset_download`, `notebook_search`

### Files Changed
| File | Change type |
|------|------------|
| `src/app/plugins/page.tsx` | Modified (2 new plugin entries) |

### Rollback
```bash
git checkout v1.103   # reverts to RELEASES.md update only
```

---

## v1.103 — RELEASES.md: Full Agentic Workflow Documentation
**Date:** 2026-03-28
**Tag:** `v1.103`
**Commit:** `a5ebe1b`
**Status:** Stable

### Changes
- Full release notes for v1.101 and v1.102 added (files changed table, rollback command, commit hash)
- Developer Guide completely rewritten for agentic AI coding:
  - **Versioning philosophy table**: typo/fix → single component → cross-page → major milestone
  - **Rollback options A/B/C**: rollback branch (safe), hard reset (destructive), revert commit (non-destructive)
  - **Cherry-pick recipe**: apply a single fix from a newer commit onto a rollback branch
  - **Session start/end checklists**: structured workflow for Claude Code sessions
  - **Stable version reference table**: quick orientation for all tagged versions

### Files Changed
| File | Change type |
|------|------------|
| `RELEASES.md` | Modified (208 lines added) |

### Rollback
```bash
git checkout v1.102   # reverts to assets filter/sort state
```

---

## v1.102 — Platform Config, Assets Filter/Sort, Settings Polish
**Date:** 2026-03-28
**Tag:** `v1.102`
**Commit:** `54a6a9b`
**Status:** Stable

### New Features

#### `src/lib/platform-config.ts` (NEW — central source of truth)
- Single file exports `PLATFORM_CONFIG` with `name`, `version`, `build`, `license`, `copyright`, `techStack`
- **Update version in one place** → propagates to sidebar footer (`auth-gate.tsx`) and Settings → About automatically
- Eliminates stale hardcoded strings scattered across components

#### Settings → API Keys (`src/app/settings/page.tsx`)
- Split into two labelled sections: **AI Model Providers** and **Data Sources & Services**
- Added **Anthropic API** entry — shown as "✓ Server env var" (configured in Vercel; not exposed to client)
- Added **Groq Cloud API** entry (Llama 3.3 70B)
- **Foundation Model** badge on provider keys links to `/models`
- "Manage in Vercel" label replaces Show/Rotate buttons for server-side keys

#### Settings → About (`src/app/settings/page.tsx`)
- Version, Build, License, Copyright all read from `PLATFORM_CONFIG` — no more stale `1.0.0-beta`
- Added **Institution** row
- Tech stack badge list now from config (includes Vercel)

#### Settings → Profile (`src/app/settings/page.tsx`)
- **Organization Email** field with full verification flow:
  - Enter `.edu` / org address → click **Send Code** → enter 6-digit OTP → **Verified ✓** badge
  - Once verified, field locks; user can clear and re-verify with a different address
- **Researcher Profiles** row:
  - **LinkedIn** URL field
  - **X / Twitter** handle field
  - **ORCID iD** field (monospace, pattern hint `0000-0000-0000-0000`) — shows live "View ORCID profile ↗" deep-link once filled

#### Projects → Assets tab (`src/app/projects/page.tsx`)
- **Type filter pills**: All Types / Document / Dataset / Compound Library / Model / Report
- **Project dropdown**: filter by individual project or show all
- **Sortable column headers**: Name, Type, Project, Date, Size — click to sort ascending, click again to flip; ▲/▼ active indicator, ⇅ inactive
- Size sort parses MB/GB/KB correctly for numeric ordering
- **Live count** (`N assets`) updates as filters change
- **Empty-state row** when no assets match filters

### Files Changed
| File | Change type |
|------|------------|
| `src/lib/platform-config.ts` | **Created** |
| `src/app/settings/page.tsx` | Modified (Profile, API Keys, About tabs) |
| `src/app/projects/page.tsx` | Modified (Assets tab filter/sort) |
| `src/app/auth-gate.tsx` | Modified (version label → PLATFORM_CONFIG) |

### Rollback
```bash
git checkout v1.101   # reverts to role-color avatar state
```

---

## v1.101 — Role-Color Avatar, Pinned Card Footers, Clickable Project Names
**Date:** 2026-03-28
**Tag:** `v1.101`
**Commit:** `de5caff`
**Status:** Stable

### New Features

#### Role-encoded avatar (`src/app/auth-gate.tsx`)
- Avatar background color now encodes the user's platform role at a glance:
  - 🟠 **Orange** = Owner
  - 🔴 **Red** = Admin
  - 🔵 **Blue** = Developer
  - ⚫ **Gray** = User
- Clicking avatar navigates to `Settings → Profile` (role change selector)
- Entire `RoleSwitcher` dropdown removed from sidebar footer — cleaner UI

#### Pinned card footer — services page (`src/app/services/page.tsx`)
- All AI Agent cards use `flex flex-col` + `mt-auto pt-3 border-t space-y-3` footer wrapper
- Entity chips, stats row, and **Run Agent** button always align at the bottom regardless of content length
- Uniform card height across any row — no ragged bottoms

#### Clickable project names in Team tab (`src/app/projects/page.tsx`)
- Project names on team member cards are now `<a>` links
- Clicking navigates to `/projects#PRJ-XXX` — browser scrolls to and highlights the project card in the Overview tab
- `id={project.id}` + `scroll-mt-6` anchors added to Overview cards
- `projectNameToId` lookup map handles name → id resolution

### Files Changed
| File | Change type |
|------|------------|
| `src/app/auth-gate.tsx` | Modified (role-color avatar, removed RoleSwitcher) |
| `src/app/services/page.tsx` | Modified (card footer alignment) |
| `src/app/projects/page.tsx` | Modified (anchor IDs, clickable project links) |

### Rollback
```bash
git checkout v1.100   # reverts to major release state
```

---

## ⭐ v1.100 — Major Release: Enterprise Platform
**Date:** 2026-03-28
**Tag:** `v1.100`
**Status:** Stable ⭐

### Highlights
- **Enterprise RBAC** with Owner/Admin/Developer/User roles (GitHub-style)
- **Plugin Test Modal** with live animated MCP tool call verification
- **Models Leaderboard** — Arena ELO, HF stars, cost-per-provider, sortable
- **Projects nav** converted to collapsible group: Directory · Team · Performance · Reports
- **A.G.E. scores** (Activity · Goal · Execution) on all project cards
- **Talent Knowledge Graph MCP** — Excel upload + KG query → candidate team members
- **Office Tools tab** — Notion, Google Drive, OneDrive, BOX, Gmail, Calendar, Zapier, read.ai, YouTube
- **Privacy & Legal** settings tab with full data use disclosure and legal disclaimers
- **Sidebar** cleaned up: role switcher moved to Settings → Profile; system version (v1.100) shown in footer
- **Card alignment** — all service cards use flex-col with pinned stats rows and line-clamp titles
- **Design with AI** — DMBT flywheel replaced with clean 4-card phase grid
- **Uninstall plugin** — trash icon + "type yes to confirm" safety modal
- **Regulation nav** — IRB Protocols + Clinical Trial Documents added
- All models remote-only (Llama via Groq API, no local deployment)
- Vercel ANTHROPIC_API_KEY confirmed — AI Chat now uses live Claude completions

---

## v1.007 — Enterprise RBAC, Plugin Test Modal, Models Leaderboard
**Date:** 2026-03-28
**Tag:** `v1.007`
**Status:** Stable

### New Features
- **Enterprise Role-Based Access Control** — GitHub-style roles (Owner → Admin → Developer → User):
  - New `src/lib/roles.ts` — `AppRole` type, `ROLE_ORDER`, `hasRole()`, `can()`, `ROLE_PERMISSIONS` map, `ROLE_META` badges
  - Dr. Jake Chen seed account promoted to `"Owner"` role
  - **RoleSwitcher** in sidebar footer — demo dropdown lets Owner impersonate any role to verify gated UI
  - User profile row shows colored role badge (orange=Owner, red=Admin, blue=Developer, gray=User)
- **Plugins page — role-gated UI**:
  - **Developer+**: connected tool list, Integration Guide accordion (5-step MCP setup), Uninstall button
  - **User**: simplified "Connected and ready" view; Install Free / Connect with API Key buttons only
  - Yellow info bar for non-Developer users explaining how to request access
  - Role banner in page header reflecting current user's access level
- **Plugin Test Modal** (all roles):
  - Click 🧪 test button on any installed/connected plugin
  - Auto-runs through `testSteps` array with 900 ms animated delays
  - Shows live tool call → result pairs as they complete
  - Ends with green "Connection verified" success card; "Run again" resets and re-runs
  - ChEMBL test: `target_search("BRAF V600E")` → CHEMBL5145, `compound_search("vemurafenib")` → CHEMBL1229517
- **Models Leaderboard** tab (new tab in `/models`):
  - 7 entries: Gemini 2.5 Pro, Claude Opus 4, GPT-4o, Claude Sonnet 4.5, Mistral Large 2, Llama 3.3 70B, BioGPT-Large
  - Sortable columns: Arena ELO, HF Stars, Context (K), Input $/1M, Release Date, Params (B)
  - Color-coded ELO (green ≥1350, yellow ≥1250)
  - Notes panel showing selected model's detailed commentary
  - Sources footnote: LMSYS Arena, HuggingFace, provider pricing pages
- **Remote-only model policy**:
  - Llama 3.3 70B converted from `status: "local"` → `status: "available"` via Groq Cloud API ($0.39/1M)
  - Drug-GPT and BioGPT descriptions updated to reflect remote API endpoints (not local Ollama)
  - Usage mock updated: Llama now shows $0.21 cost (Groq pricing)

---

## v1.006 — Foundation Models Hub
**Date:** 2026-03-28
**Tag:** `v1.006`
**Status:** Stable

### New Features
- **Foundation Models page** (`/models`) — full model management hub with 4 tabs:
  - **Model Catalogue**: 8 models (Claude Sonnet 4.5, Claude Opus 4, GPT-4o, Gemini 2.5 Pro, Drug-GPT, BioGPT, Llama 3.3 70B, Mistral Large 2) with status tiles, uptime bars, pricing, context window, domain-tuned badges
  - **API Keys**: table view with masked keys, Rotate / Add / Remove actions, per-model key status
  - **Usage & Costs**: monthly spend dashboard, per-model breakdown table, cost distribution bar chart
  - **Settings**: default model selector, monthly cost cap with % used indicator, 4 safety/compliance guardrails (with platform-lock indicator)
- **API Key modal**: masked input with show/hide toggle for rotating or adding new keys
- **Active model banner**: shows currently selected model with warning that AI Chat is a mock until `ANTHROPIC_API_KEY` is added to Vercel
- **Sidebar**: added "Foundation Models" nav item with BrainCircuit icon

---

## v1.005 — ChEMBL MCP Integration + MCP Intelligence UI
**Date:** 2026-03-28
**Tag:** `v1.005`
**Status:** Stable

### New Features
- **ChEMBL MCP Server — confirmed live** (6 tools: `compound_search`, `drug_search`, `target_search`, `get_bioactivity`, `get_mechanism`, `get_admet`)
- **Design with AI → MCP Intelligence tab** — side-by-side "Without MCP" vs "With ChEMBL MCP" comparison for BRAF V600E / melanoma use case:
  - Live ChEMBL data: BRAF target `CHEMBL5145`, vemurafenib `CHEMBL1229517`, dabrafenib `CHEMBL2028663`
  - Top biochemical hits (IC50 5–10 nM, pChEMBL 8.0–8.3)
  - ADMET property panel (MW, ALogP, PSA, QED, Ro5 violations)
  - MCP tool call log showing all 6 queries executed in this session
  - MCP-derived design insight: target property profile for next-gen BRAF inhibitor
- **Tool Plugins page** — ChEMBL MCP card shows "● Connected" live badge with all 6 tool names
- **Tool Plugins → Integration Guide** — 5-step collapsible accordion for adding any MCP server, using ChEMBL as reference implementation (find → configure → verify → test → replicate)

---

## v1.004 — Multimedia Feedback + Font Size Accessibility
**Date:** 2026-03-28
**Tag:** `v1.004`
**Status:** Stable

### New Features
- **Multimedia Feedback Widget** — users can now attach images, audio, and files to feedback:
  - Paste screenshots directly (Ctrl/Cmd+V) from clipboard
  - Drag & drop images/files into the feedback panel
  - Pick files from gallery/camera via file picker (`image/*, audio/*, video/*, .pdf`)
  - **Voice notes** — record up to 120-second audio clips directly in the browser (MediaRecorder API, webm/mp4 codec auto-detection)
  - Image thumbnails and inline `<audio>` player for voice note preview
  - Images auto-resized to max 800px JPEG using Canvas API before upload
  - Attachment metadata (name, type) listed in GitHub Issues; full data saved in `feedback-log.json`
- **Font Size Accessibility** — three "A" buttons in sidebar footer:
  - **A** (small) — Normal (100%, default)
  - **A** (medium) — Large (115%)
  - **A** (large) — Largest (130%)
  - Adjusts root `font-size` so all `rem`-based text scales site-wide
  - Active level highlighted in primary color

---

## ⭐ v1.003 — Mobile Admin Agent Console
**Date:** 2026-03-28
**Tag:** `v1.003`
**Status:** Stable

### New Features
- **Admin → 🤖 Agent tab** — full mobile-friendly development console:
  - **Issue Queue** — shows open GitHub Issues (label: `feedback`) + local `feedback-log.json`, sorted by priority
  - **File Selector** — pre-populated with key source files; add custom paths
  - **Analyze** — sends issue + selected files to Claude (claude-sonnet-4-6) via Anthropic API; returns root-cause analysis + proposed search/replace diffs
  - **Diff Review** — collapsible before/after code blocks (red = remove, green = add)
  - **Approve & Deploy** — commits each change to GitHub via Contents API → Vercel auto-deploys in ~60 seconds; closes the GitHub issue automatically
- **New API routes:**
  - `GET /api/admin/issues` — merged GitHub Issues + local log, sorted by priority
  - `POST /api/admin/analyze` — Claude analysis endpoint (60s timeout)
  - `POST /api/admin/commit` — GitHub file commit endpoint

### Configuration Required
Add to `.env` (or Vercel environment variables):
```
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=aimed-lab
GITHUB_REPO=smartdrugdiscovery
```

### Mobile Workflow
1. Open `studio.smartdrugdiscovery.org/admin` on phone
2. Tap **🤖 Agent** tab
3. Select an issue from the queue
4. Check relevant files → **Analyze with Claude**
5. Review diff → **Approve & Deploy**
6. Production updates in ~60 seconds — no laptop needed

---

## v1.002 — Sidebar Label & Tagline Polish
**Date:** 2026-03-28
**Tag:** `v1.002`
**Status:** Stable

### Changes
- Nav group labels shortened to single words: **Biology, Pharmacology, Clinical, Regulation** (eliminates two-line wrapping on mobile)
- Tagline changed from "FASTER · CHEAPER · PERSONALIZED" to **"AIDD 2.0 · OSDD2"** — fits on one line, ties to platform identity

---

## ⭐ v1.001 — Mobile Responsive + Feedback System
**Date:** 2026-03-28
**Tag:** `v1.001`
**Status:** Stable

### New Features
- **Feedback Widget** — floating button on every page opens a bottom-sheet form
  - Type selector: Bug 🐛 / Enhancement ✨ / Idea 💡
  - Priority selector: P0 Critical → P3 Low (color-coded)
  - Auto-captures: page URL, logged-in user, timestamp
  - Submits to `POST /api/feedback` → creates GitHub Issue + writes `feedback-log.json`
  - `GET /api/feedback` returns all entries sorted by priority (for use at start of coding sessions)
- **Sidebar icons** — lucide-react icons added to all nav groups and utility items
- **"Systems Pharmacology"** — renamed from "Pharmacology" in sidebar

### Bug Fixes / Mobile Improvements
- **Sidebar now mobile-friendly** — hidden off-screen on mobile; hamburger button in top bar slides it in with a dark backdrop
- **Assets table** — enforced `min-w-[640px]` so horizontal scroll works correctly on mobile
- **Tab bar** — scrollable horizontally on narrow screens (tabs no longer get clipped)
- **Page padding** — reduced from `p-8` to `p-4 md:p-8` for better mobile layout

### Configuration
To enable GitHub Issues integration, set in `.env`:
```
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=aimed-lab
GITHUB_REPO=smartdrugdiscovery
```
GitHub's built-in email notifications then alert the team on each new issue.

---

## ⭐ v1.000 — Initial Platform Release
**Date:** 2026-03-27
**Tag:** `v1.000`
**Status:** Stable (baseline)

### Features at this release
- Authentication with invite code (`SPARC2026`)
- Persistent user database (localStorage + seed users)
- 4-domain navigation: Disease Biology, Pharmacology, Clinical Development, Regulatory Compliance
- 16 sub-pages scaffolded
- Projects page: Overview, Kanban, Timeline, Team, Assets tabs
- Add-on Services page with AI Agent cards (ADMET, Docking, Literature Mining)
- Settings page with profile editor
- Dark mode toggle
- UAB deep green color theme (`#1B5E20`)
- Claude-style sidebar footer with user profile
- Login page with no-flash navigation

---

## Developer Guide

### Versioning philosophy (Agentic AI coding)

Each logical unit of work gets its own mini-version tag. This keeps the history granular enough to:
- **Identify** exactly which commit introduced a regression
- **Revert** a single feature without touching others (cherry-pick or reset)
- **Move forward** by cherry-picking a fix onto a rollback branch

Tag frequency guidelines:
| Scope | Example | Bump |
|-------|---------|------|
| Typo / copy fix | Fix label wording | +0.001 |
| Single component | New filter on a table | +0.001 |
| Multi-component feature | New profile fields + verification | +0.001 |
| Cross-page feature set | New nav group + 3 sub-pages | +0.001–0.003 |
| Major milestone | Enterprise RBAC, complete platform overhaul | +0.093 (jump to x.100) |

---

### How to create a new release

```bash
# 1. Make focused commits (one logical feature per commit where possible)
git add src/app/specific-file.tsx src/lib/specific-lib.ts
git commit -m "v1.103 — Short description of what changed and why"

# 2. Tag the commit with the next version
git tag -a v1.103 HEAD -m "v1.103 — Short description"

# 3. Push code AND tags together
git push origin main --tags

# 4. Update RELEASES.md (this file) with:
#    - Version heading, date, commit hash, status
#    - Feature bullets with file names
#    - Files Changed table
#    - One-line rollback command
```

---

### How to roll back to a stable version

```bash
# List all tags newest-first
git tag --sort=-version:refname

# Inspect what changed at a specific version (read-only)
git show v1.101

# See diff between two versions
git diff v1.100 v1.102

# Option A — rollback branch (safest, non-destructive)
git checkout -b rollback/v1.101 v1.101
git push origin rollback/v1.101
# In Vercel dashboard → Settings → Git → Production Branch → rollback/v1.101

# Option B — hard reset on main (destructive, only if you're sure)
# git reset --hard v1.101
# git push origin main --force   ← only with team agreement

# Option C — revert a single commit (non-destructive, creates a new commit)
git revert <commit-hash>
git push origin main --tags
```

---

### How to cherry-pick a fix onto a rollback branch

```bash
# You're on rollback/v1.101 and want to apply only the platform-config fix from v1.102
git cherry-pick 54a6a9b   # use the commit hash of the specific change
git push origin rollback/v1.101
```

---

### How to start a coding session with feedback review

```bash
# View all pending feedback sorted by priority (local dev)
curl "http://localhost:3000/api/feedback" | jq .

# Production
curl "https://studio.smartdrugdiscovery.org/api/feedback" | jq .
```

---

### Agentic AI session checklist

Use this at the **start** of each Claude Code session:

1. `git log --oneline -10` — review last 10 commits to understand current state
2. `curl localhost:3000/api/feedback | jq .` — review open feedback items
3. Agree on the feature scope for this session
4. Work in small commits (one feature at a time)
5. Tag each commit with the next mini-version
6. Update `RELEASES.md` with a new entry per tag
7. `git push origin main --tags`

Use this at the **end** of each session:

1. Verify Vercel deploy succeeded (check dashboard or wait ~90s)
2. Tag the final commit if not already done
3. Confirm `RELEASES.md` is up to date
4. Note any **Pending Tasks** in the last RELEASES.md entry for the next session

---

### Stable version reference table

| Tag | Status | Key feature |
|-----|--------|-------------|
| `v1.108` | Stable | **Fix:** profile fields persist correctly to localStorage |
| `v1.106` | Stable | Synchronized role avatar, emoji/photo, models button fix |
| `v1.104` | Stable | HuggingFace + Kaggle plugin connectors |
| `v1.103` | Stable | RELEASES.md agentic workflow guide |
| `v1.102` | Stable | Platform config, Assets filter/sort, Settings polish |
| `v1.101` | Stable | Role-color avatar, card footer alignment |
| `v1.100` | ⭐ Major | Enterprise RBAC, full platform overhaul |
| `v1.007` | Stable | Models Leaderboard, Plugin Test Modal |
| `v1.006` | Stable | Foundation Models hub |
| `v1.005` | Stable | ChEMBL MCP integration |
| `v1.004` | Stable | Multimedia feedback + font size |
| `v1.003` | ⭐ Stable | Mobile Admin Agent Console |
| `v1.001` | ⭐ Stable | Mobile responsive + Feedback system |
| `v1.000` | ⭐ Stable | Initial release (baseline) |

---

### Multi-developer workflow
1. Each developer works on a feature branch (`git checkout -b feature/my-feature`)
2. Open a PR against `main`
3. PR merged → triggers Vercel Preview deployment
4. After review, merge to `main` → triggers Vercel Production deployment
5. Tag `main` with next version number and update this file

---

*Maintained by the UAB Systems Pharmacology AI Research Center*
