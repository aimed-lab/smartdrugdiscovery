# SmartDrugDiscovery — Documentation

**SmartDrugDiscovery** is an AIDD 2.0 (AI-Driven Drug Discovery) platform developed by the UAB Systems Pharmacology AI Research Center. It integrates foundation models, MCP-based data tools, project management, and scientific workflow automation into a single, browser-accessible interface.

This `docs/` directory is maintained alongside the codebase. Every file here reflects the current state of the application; when code changes, these docs change with it.

---

## Quick Links

| Document | What it covers |
|---|---|
| [Getting Started](getting-started.md) | Login, dashboard tour, first steps for new users |
| [Roles and Permissions](roles-and-permissions.md) | RBAC hierarchy, permission table, how to change roles |
| [Ownership Transfer](ownership-transfer.md) | 24-hour transfer process, cooling-off, edge cases |
| [Platform Architecture](platform-architecture.md) | Tech stack, source file map, API routes, MCP integrations |
| [API Reference](api-reference.md) | Internal Next.js API route specifications |

---

## About This Platform

| Field | Value |
|---|---|
| **Platform name** | SmartDrugDiscovery |
| **Current version** | 1.134 |
| **License** | Enterprise |
| **Copyright** | © 2026 UAB Systems Pharmacology AI Research Center |
| **Deployed on** | Vercel |

---

## Using the Docs with the In-App AI Assistant

Every page in SmartDrugDiscovery includes a floating **AI Assistant** widget (bottom-right corner of the screen). You can ask it any question about the platform — how features work, what permissions your role has, how to configure an MCP server — and it will answer using its knowledge of the codebase.

**Tips:**
- The assistant is context-aware: it knows which page you are currently on.
- Use the **Ask** tab for how-to questions and feature explanations.
- Use the **Feedback** tab to report bugs or suggest improvements. Submissions automatically create a GitHub Issue and are logged for the admin team.
- The assistant is not a substitute for this documentation — use these docs as the authoritative reference for policies (RBAC rules, transfer procedures, API contracts).

---

## Documentation Maintenance

These files live in `docs/` at the root of the repository. They are written in GitHub-flavoured Markdown and render automatically on GitHub. When contributing code changes that affect user-visible behaviour, update the relevant doc file in the same pull request.

Release history is tracked separately in [`RELEASES.md`](../RELEASES.md) at the repository root.
