# Getting Started

This guide walks new users through logging in, orienting themselves in the dashboard, and completing the essential first-time setup steps.

---

## Logging In

1. Open the SmartDrugDiscovery URL in your browser (provided by your administrator).
2. On the login screen, enter:
   - **Email address** — your work or institutional email
   - **Invite code** — `SPARC2026`
3. Click **Sign In**.

If your email has been pre-seeded by the platform administrator (e.g., you are the Owner), your profile will load automatically with your pre-configured name, title, and role. If your email is new to the system, a default profile is created and you can customise it in Settings.

> The invite code `SPARC2026` is valid for all users in the current release. Contact your administrator if sign-in fails.

---

## Dashboard Overview

After logging in, you land on the main dashboard. The left sidebar is the primary navigation surface.

### Scientific Domains

The top section of the sidebar contains four scientific research domains. Each domain links to domain-specific tools and AI-powered workflows:

| Domain | Focus area |
|---|---|
| **Biology** | Target identification, gene/protein analysis, pathway mapping |
| **Pharmacology** | ADMET profiling, bioactivity data, compound screening |
| **Clinical** | Clinical trial data, endpoint analysis, patient stratification |
| **Regulation** | Regulatory pathways, compliance frameworks, submission planning |

### Platform Utilities

Below the scientific domains, the sidebar lists platform-level features:

| Section | What it does |
|---|---|
| **Projects** | Full project management workspace with Overview, Kanban board, Timeline, Team, and Assets views |
| **Design with AI** | Generative design tools for scientific figures, diagrams, and visual assets |
| **Foundation Models** | Browse and connect AI foundation models; manage your personal API keys |
| **Add-on Services** | Extended service integrations and Office Tools (document processing, etc.) |
| **Tool Plugins** | MCP plugin marketplace — browse, install, and configure data source integrations |

### Bottom of the Sidebar

- **Settings** — profile, API keys, privacy, and platform information
- Your **role avatar** — colour-coded circle showing your initials and role (see [Roles and Permissions](roles-and-permissions.md))
- **Platform version** — displayed in the footer (e.g., `v1.100`)

---

## First Steps

### 1. Set Up Your Profile

Go to **Settings → Profile** and fill in:

- **Display name** and **title** (shown in your avatar tooltip and team views)
- **Institution** (your organisation affiliation)
- **Avatar** — choose between initials (default), a single emoji, or a photo upload
- **Social profiles** — LinkedIn URL, Twitter/X handle, ORCID iD
- **Institutional email** — a separate org email that can be verified via OTP

Click **Save Profile** when done. A green confirmation banner confirms the save. All profile data is currently persisted in your browser's local storage.

### 2. Install the ChEMBL MCP Plugin

ChEMBL is the most commonly used data plugin for drug discovery workflows. To install it:

1. Navigate to **Tool Plugins** in the sidebar.
2. Locate the **ChEMBL** plugin in the catalogue.
3. Click **Install** (it is a free plugin — no API key required).
4. Once installed, click **Test** to verify the connection.

After installation, ChEMBL compound search, bioactivity queries, ADMET lookups, and mechanism-of-action data become available in your AI-assisted workflows.

### 3. Connect Your Anthropic API Key

To use foundation models (Claude Sonnet, Opus, Haiku) with your own usage quota:

1. Navigate to **Foundation Models** in the sidebar.
2. Click **Add Personal API Key**.
3. Paste your Anthropic API key (starts with `sk-ant-`).
4. The platform validates the key and stores it encrypted in your session.

If you do not have a personal API key, the platform may use a shared organisation key if one has been configured by your Admin.

### 4. Explore a Project

1. Navigate to **Projects** in the sidebar.
2. Open an existing project or create a new one.
3. Switch between views using the tabs at the top of the project page:
   - **Overview** — summary cards and status
   - **Kanban** — drag-and-drop task board
   - **Timeline** — Gantt-style schedule view
   - **Team** — member list and role assignments
   - **Assets** — files, links, and data attachments

---

## Using the AI Assistant Widget

A floating **AI Assistant** button appears in the bottom-right corner of every page. Click it to open a panel with two tabs:

### Ask Tab

Type any question about the platform or your current page. The assistant knows:

- What page you are on and its context
- Your current role and available permissions
- How platform features work
- How to navigate to specific tools

**Example questions:**
- "How do I install a paid plugin with my own API key?"
- "What can an Admin do that a Developer cannot?"
- "How do I switch to the Kanban view in Projects?"

### Feedback Tab

Use the Feedback tab to report bugs, request enhancements, or share ideas.

1. Select the **type**: Bug, Enhancement, or Idea.
2. Select the **priority**: P0 Critical, P1 High, P2 Medium, or P3 Low.
3. Enter a **title** (required) and optional **details**.
4. Optionally attach **screenshots** (drag and drop or paste), **audio recordings** (record in-browser), or **files**.
5. Click **Submit**.

Submissions are:
- Automatically posted as GitHub Issues in the project repository (if GitHub is configured).
- Logged locally to `feedback-log.json` on the server.
- Visible to Admins and Owners in the Admin Console.

---

## Keyboard and Accessibility Notes

- Font sizes in the sidebar and across the UI are accessible at standard browser zoom levels.
- The sidebar can be collapsed on mobile by tapping the hamburger icon in the top bar.
- All interactive elements are keyboard-navigable and include ARIA labels.

---

## Next Steps

- Read [Roles and Permissions](roles-and-permissions.md) to understand what your role allows.
- Read [Platform Architecture](platform-architecture.md) if you are a Developer setting up MCP servers or API integrations.
- Check [API Reference](api-reference.md) for the internal API routes (relevant for Developers and Admins).
