# Getting Started

This guide walks new users through logging in, orienting themselves in the dashboard, and completing the essential first-time setup steps.

---

## Logging In

### Returning Users

1. Open the SmartDrugDiscovery URL in your browser.
2. Enter your **email address** (the one you registered with).
3. Leave the **Invitation Code** field empty.
4. Click **Sign In**.

### New Users (First-Time Registration)

New users need an invitation to join the platform:

1. Receive an **invite link** from a team member (e.g., `https://smartdrugdiscovery.org/login?invite=ABCD1234`). Clicking the link opens the login page with the code pre-filled. Alternatively, your inviter may share a code directly.
2. Enter your **email address**.
3. Enter the **invitation code** (8-character token, or `SPARC2026` for SPARC staff).
4. Click **Sign In**.

**What happens next depends on the invitation type:**

- **Auto-approved invitations** (created by Admin/Owner with the auto-approve flag, or the `SPARC2026` bootstrap token): You gain immediate platform access.
- **Standard invitations**: Your account is created in **pending approval** status. You'll see an "Awaiting Approval" screen until an administrator approves your registration. Click **Check Status** to refresh.

> **SPARC staff:** Use invite code `SPARC2026` to register as a Developer with immediate access. Contact your administrator if you need a different role or if sign-in fails.

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
- **Platform version** — displayed in the footer (e.g., `v1.134`)

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

### 3. Set Up Your API Key (Activates the AI Assistant)

The platform assistant and Foundation Models require your own API key. Multiple providers are supported — choose whichever fits your budget and preferences:

| Provider | Models | Cost | Key format |
|---|---|---|---|
| **Anthropic** | Claude Sonnet 4.5, Opus 4 | Premium | `sk-ant-...` |
| **OpenAI** | GPT-4o, GPT-4o mini | Premium | `sk-...` |
| **Google Gemini** | Gemini 2.5 Flash, 2.0 Flash | Free tier available | `AIza...` |
| **DeepSeek** | DeepSeek-V3, DeepSeek-R1 | Very cheap | `sk-...` |
| **Groq** | Llama 3.3 70B | Free tier available | `gsk_...` |
| **Perplexity** | Sonar Pro (search-augmented) | Mid-range | `pplx-...` |
| **Kimi (Moonshot)** | Moonshot v1 128K/32K/8K | Cheap | `sk-...` |
| **GLM (Zhipu AI)** | GLM-4 Plus, Flash | Cheap | `{id}.{secret}` |

To set up:

1. Navigate to **Settings → API Keys**.
2. Enter your key for one or more providers.
3. Click **Save API Keys**.

Once saved, the **Platform Assistant** (bottom-right chat bot) activates immediately. If you configure multiple providers, you can switch between them using the provider selector pills in the assistant widget.

> **Budget tip:** DeepSeek, Groq, and Google Gemini offer free or very low-cost tiers suitable for testing.

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

A floating **AI Assistant** button appears in the bottom-right corner of every page. Click it to open a panel with three tabs:

> **Prerequisite:** The AI assistant requires an API key. If you haven't set one up yet, the Ask tab will show a setup prompt linking to Settings → API Keys. See [Step 3 above](#3-set-up-your-api-key-activates-the-ai-assistant).

### Ask Tab

Type any question about the platform or your current page. The assistant knows:

- What page you are on and its context
- Your current role and available permissions
- How platform features work
- How to navigate to specific tools

If you have multiple API keys configured, **provider selector pills** appear at the bottom of the chat, letting you switch between providers (e.g., Anthropic, DeepSeek, Gemini) mid-conversation.

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
