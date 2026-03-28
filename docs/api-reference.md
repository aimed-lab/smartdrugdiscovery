# API Reference

This document specifies the internal Next.js API route handlers for SmartDrugDiscovery. All routes are located under `src/app/api/` and are served at `/api/...` relative to the application root.

These are **internal** routes — they are not a public API and are subject to change between versions. They are used by the platform's own client pages and the Admin Agent Console.

---

## Authentication and Security

There is no session-token authentication on these routes in the current version (authentication is client-side only). Security is enforced through:

- **Vercel environment variable gating** — routes that require `GITHUB_TOKEN` or `ANTHROPIC_API_KEY` return `503` if those variables are not set.
- **`FEEDBACK_READ_KEY`** — the `GET /api/feedback` endpoint optionally checks a bearer key passed as a query parameter.
- **Deployment-level access control** — all routes are only reachable through the Vercel deployment, which can be restricted by Vercel Access policies.

Server-side secrets (GitHub token, Anthropic key) are never returned in any response body.

---

## POST /api/feedback

Submit a user feedback entry. Creates a GitHub Issue (if GitHub is configured) and appends the entry to `feedback-log.json` on the server filesystem.

### Request body

```json
{
  "type": "bug" | "enhancement" | "idea",
  "priority": "p0" | "p1" | "p2" | "p3",
  "title": "string (required)",
  "description": "string (optional)",
  "url": "string — current page URL",
  "pageTitle": "string — current page title",
  "user": {
    "name": "string",
    "email": "string"
  } | null,
  "timestamp": "ISO 8601 string",
  "attachments": [
    {
      "id": "string",
      "name": "filename.ext",
      "mimeType": "image/jpeg",
      "dataUrl": "data:image/jpeg;base64,...",
      "kind": "image" | "audio" | "file"
    }
  ]
}
```

`title` is the only required field. All other fields are optional and default gracefully.

### Response — 200 OK

```json
{
  "success": true,
  "id": "FB-1711234567890",
  "issueUrl": "https://github.com/owner/repo/issues/42" | null,
  "issueNumber": 42 | null
}
```

`issueUrl` and `issueNumber` are `null` when GitHub is not configured or the API call fails. Feedback is always saved to the local log regardless of GitHub status.

### Response — 400 Bad Request

```json
{ "error": "Title is required" }
```

### GitHub Issue format

When GitHub is configured, the created issue includes:

- **Title:** `[emoji] [PRIORITY] title` (e.g., `🐛 [P1] Login page throws 500 on empty password`)
- **Labels:** `type:{type}`, `priority:{priority}`, `feedback`
- **Body:** Structured Markdown table with submitter, page URL, date, description, and attachment list

Required environment variables: `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`.

---

## GET /api/feedback

List all feedback entries from `feedback-log.json`, sorted by priority then timestamp (newest first within each priority band).

### Query parameters

| Parameter | Required | Description |
|---|---|---|
| `key` | Conditional | Must match `FEEDBACK_READ_KEY` env var if that var is set |

### Response — 200 OK

Returns a JSON array of `FeedbackEntry` objects sorted by priority:

```json
[
  {
    "id": "FB-1711234567890",
    "type": "bug",
    "priority": "p0",
    "title": "Login page crashes on empty password",
    "description": "Steps to reproduce...",
    "url": "https://app.example.com/login",
    "pageTitle": "Login",
    "user": { "name": "Dr. Jane Smith", "email": "jsmith@uab.edu" },
    "timestamp": "2026-03-28T14:00:00.000Z",
    "attachments": [],
    "githubIssueUrl": "https://github.com/owner/repo/issues/5",
    "githubIssueNumber": 5
  }
]
```

### Response — 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

Returned when `FEEDBACK_READ_KEY` is set and the request does not include a matching `key` query parameter.

### Notes

- On Vercel's production filesystem (read-only), `feedback-log.json` cannot be written. In that case, feedback is only persisted to GitHub Issues. The GET endpoint returns an empty array if the file does not exist.
- Priority sort order: P0 > P1 > P2 > P3. Within a priority band, newest entries appear first.

---

## GET /api/admin/issues

Returns a merged list of open GitHub Issues (tagged `feedback`) and any local `feedback-log.json` entries that are not already represented in GitHub. Used by the Admin Agent Console to display the full issue queue.

### Request

No parameters required.

### Response — 200 OK

```json
{
  "items": [ /* array of FeedbackEntry objects, same shape as GET /api/feedback */ ],
  "githubConfigured": true,
  "anthropicConfigured": true,
  "repo": "owner/repo-name" | null
}
```

`githubConfigured` is `true` when all three GitHub env vars are present. `anthropicConfigured` is `true` when `ANTHROPIC_API_KEY` is set. These flags let the Admin Console UI show/hide the Analyze and Commit buttons appropriately.

### Deduplication logic

An item from `feedback-log.json` is omitted from the merged list if its `githubIssueNumber` matches an issue already fetched from the GitHub API. This prevents duplicates when both sources contain the same entry.

### GitHub API query

```
GET /repos/{owner}/{repo}/issues?labels=feedback&state=open&per_page=50&sort=created&direction=desc
```

---

## POST /api/admin/analyze

Sends a feedback item and one or more source files to Claude (claude-sonnet-4-6) for root-cause analysis and proposed code fix generation. This is the backend for the Admin Console's "Analyze" button.

**Maximum duration: 60 seconds** (set via `export const maxDuration = 60`).

Requires `ANTHROPIC_API_KEY` to be set, or returns `503`.

### Request body

```json
{
  "issue": {
    "id": "FB-1711234567890",
    "type": "bug",
    "priority": "p1",
    "title": "Login page crashes on empty password",
    "description": "Steps to reproduce...",
    "url": "https://app.example.com/login",
    "timestamp": "2026-03-28T14:00:00.000Z"
  },
  "filePaths": [
    "src/app/login/page.tsx",
    "src/lib/auth-context.tsx"
  ]
}
```

Files are fetched directly from the GitHub repository using the Contents API (`GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`). Files that cannot be fetched are silently skipped.

### Response — 200 OK

```json
{
  "analysis": "Root cause is X. The fix involves Y.",
  "effort": "small" | "medium" | "large",
  "changes": [
    {
      "file": "src/app/login/page.tsx",
      "description": "What this change does and why",
      "search": "exact verbatim multi-line text to replace",
      "replace": "new code to substitute in"
    }
  ],
  "reasoning": "One sentence on why these changes resolve the issue.",
  "commitMessage": "Fix: short imperative description",
  "needsFiles": ["src/path/to/another/file.tsx"]
}
```

`needsFiles` is present only when Claude determines it needs additional files not provided in the request. `changes` is an empty array in that case.

### Response — 503 Service Unavailable

```json
{ "error": "ANTHROPIC_API_KEY not configured" }
```

### Notes

- The `search` field in each change must be verbatim text from the source file. The `/api/admin/commit` route uses exact string matching against the live file content.
- Claude is instructed to keep changes minimal and focused on the reported issue.
- If no code change is needed, `changes` is `[]` and the explanation is in `analysis`.

---

## POST /api/admin/commit

Applies one or more AI-proposed code changes to files in the GitHub repository using the GitHub Contents API. Optionally closes the associated GitHub Issue if all changes succeed.

Requires `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` environment variables.

### Request body

```json
{
  "changes": [
    {
      "file": "src/app/login/page.tsx",
      "description": "Add null check for empty password",
      "search": "exact verbatim text from file to replace",
      "replace": "new replacement code"
    }
  ],
  "commitMessage": "Fix: add null check for empty password on login",
  "issueNumber": 42
}
```

`issueNumber` is optional. When provided and all changes succeed, the corresponding GitHub Issue is automatically closed with state reason `completed`.

The commit message is augmented with:
- `Closes #issueNumber` (when provided)
- `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

### Response — 200 OK

```json
{
  "results": [
    {
      "file": "src/app/login/page.tsx",
      "success": true,
      "commitUrl": "https://github.com/owner/repo/commit/abc123"
    }
  ],
  "allSuccess": true,
  "commitUrls": ["https://github.com/owner/repo/commit/abc123"]
}
```

When a change fails, the result for that file includes `success: false` and an `error` message:

```json
{
  "file": "src/app/login/page.tsx",
  "success": false,
  "error": "Search text not found verbatim in src/app/login/page.tsx. The file may have changed since analysis — re-analyze to refresh."
}
```

### Response — 503 Service Unavailable

```json
{ "error": "GitHub credentials not configured (GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO)" }
```

### Notes

- Changes are applied sequentially. A 500 ms delay is inserted between commits when multiple files are changed, to avoid race conditions on the same branch.
- The `search` field must match verbatim content in the live file. If the file has changed since the analyze call, the search will fail and the error message will prompt the user to re-analyze.
- Files are fetched fresh from GitHub immediately before each commit, so the `sha` used in the PUT request is always current.
- The GitHub Issue is only closed if **all** changes in the batch succeed.

---

## Related

- [Platform Architecture](platform-architecture.md) — environment variable reference and source file map
- [Getting Started](getting-started.md) — using the Feedback tab in the AI assistant widget
