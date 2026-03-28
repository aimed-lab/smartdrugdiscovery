# SmartDrugDiscovery — Release Notes

Versioning format: **1.xxx** (increment on each push/merge to `main`).
Tags follow `v1.xxx` in git. Stable releases are marked ⭐.

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

### How to create a new release

```bash
# 1. Commit your changes
git add -A
git commit -m "Description of changes"

# 2. Tag with next version
git tag -a v1.002 -m "v1.002 — Short description"

# 3. Push code + tag
git push origin main --tags

# Vercel auto-deploys from main branch push
```

### How to roll back to a stable version

```bash
# List stable tags
git tag --sort=-version:refname

# Check out a specific version (read-only)
git checkout v1.000

# Or create a rollback branch from a stable tag
git checkout -b rollback/v1.000 v1.000
git push origin rollback/v1.000
# Then in Vercel dashboard, set "Production Branch" to rollback/v1.000
```

### How to start a coding session with feedback review

```bash
# View all pending feedback sorted by priority
curl "http://localhost:3000/api/feedback" | jq .
# or in production:
curl "https://studio.smartdrugdiscovery.org/api/feedback?key=YOUR_FEEDBACK_READ_KEY" | jq .
```

### Multi-developer workflow
1. Each developer works on a feature branch (`git checkout -b feature/my-feature`)
2. Open a PR against `main`
3. PR merged → triggers Vercel Preview deployment
4. After review, merge to `main` → triggers Vercel Production deployment
5. Tag `main` with next version number and update this file

---

*Maintained by the UAB Systems Pharmacology AI Research Center*
