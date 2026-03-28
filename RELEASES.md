# SmartDrugDiscovery — Release Notes

Versioning format: **1.xxx** (increment on each push/merge to `main`).
Tags follow `v1.xxx` in git. Stable releases are marked ⭐.

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
