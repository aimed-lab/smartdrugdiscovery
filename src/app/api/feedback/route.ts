import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

interface FeedbackEntry {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  url: string;
  pageTitle: string;
  user: { name: string; email: string } | null;
  timestamp: string;
  githubIssueUrl: string | null;
  githubIssueNumber: number | null;
}

const TYPE_EMOJI: Record<string, string> = {
  bug: "🐛",
  enhancement: "✨",
  idea: "💡",
};

const PRIORITY_LABEL: Record<string, string> = {
  p0: "P0 Critical",
  p1: "P1 High",
  p2: "P2 Medium",
  p3: "P3 Low",
};

async function ensureGitHubLabels(token: string, owner: string, repo: string) {
  const labels = [
    { name: "type:bug", color: "d73a4a", description: "Bug report" },
    { name: "type:enhancement", color: "0075ca", description: "Enhancement request" },
    { name: "type:idea", color: "ffd700", description: "New idea" },
    { name: "priority:p0", color: "b60205", description: "Critical — blocking" },
    { name: "priority:p1", color: "e4e669", description: "High priority" },
    { name: "priority:p2", color: "0e8a16", description: "Medium priority" },
    { name: "priority:p3", color: "cfd3d7", description: "Low priority" },
    { name: "feedback", color: "7057ff", description: "Submitted via feedback widget" },
  ];

  await Promise.allSettled(
    labels.map((label) =>
      fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(label),
      })
    )
  );
}

async function createGitHubIssue(entry: FeedbackEntry): Promise<{ url: string; number: number } | null> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) return null;

  try {
    await ensureGitHubLabels(token, owner, repo);

    const emoji = TYPE_EMOJI[entry.type] ?? "📝";
    const priorityLabel = PRIORITY_LABEL[entry.priority] ?? entry.priority.toUpperCase();
    const issueTitle = `${emoji} [${entry.priority.toUpperCase()}] ${entry.title}`;

    const issueBody = `## ${emoji} ${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} Report

| Field | Value |
|-------|-------|
| **Priority** | ${priorityLabel} |
| **Submitted by** | ${entry.user?.name ?? "Anonymous"} (${entry.user?.email ?? "unknown"}) |
| **Page** | \`${entry.url}\` |
| **Date** | ${new Date(entry.timestamp).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT |

## Summary
${entry.title}

${entry.description ? `## Details\n${entry.description}\n` : ""}
---
*Submitted via SmartDrugDiscovery feedback widget · ID: ${entry.id}*`;

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: [`type:${entry.type}`, `priority:${entry.priority}`, "feedback"],
      }),
    });

    if (!res.ok) {
      console.error("GitHub API error:", res.status, await res.text());
      return null;
    }

    const issue = await res.json();
    return { url: issue.html_url, number: issue.number };
  } catch (err) {
    console.error("GitHub issue creation failed:", err);
    return null;
  }
}

function appendToLocalLog(entry: FeedbackEntry) {
  try {
    const logPath = path.join(process.cwd(), "feedback-log.json");
    let log: FeedbackEntry[] = [];
    if (existsSync(logPath)) {
      try {
        log = JSON.parse(readFileSync(logPath, "utf8"));
      } catch {
        log = [];
      }
    }
    log.unshift(entry); // newest first
    writeFileSync(logPath, JSON.stringify(log, null, 2), "utf8");
  } catch (err) {
    // On read-only filesystems (Vercel production), this silently fails
    console.warn("Could not write feedback-log.json:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, priority, title, description, url, pageTitle, user, timestamp } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const entry: FeedbackEntry = {
      id: `FB-${Date.now()}`,
      type: type ?? "bug",
      priority: priority ?? "p2",
      title: title.trim(),
      description: description?.trim() ?? "",
      url: url ?? "",
      pageTitle: pageTitle ?? "",
      user: user ?? null,
      timestamp: timestamp ?? new Date().toISOString(),
      githubIssueUrl: null,
      githubIssueNumber: null,
    };

    // Create GitHub issue (non-blocking)
    const githubResult = await createGitHubIssue(entry);
    if (githubResult) {
      entry.githubIssueUrl = githubResult.url;
      entry.githubIssueNumber = githubResult.number;
    }

    // Persist to local log
    appendToLocalLog(entry);

    return NextResponse.json({
      success: true,
      id: entry.id,
      issueUrl: entry.githubIssueUrl,
      issueNumber: entry.githubIssueNumber,
    });
  } catch (err) {
    console.error("Feedback submission error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/feedback — returns the local feedback log sorted by priority.
 * Use this at the start of a coding session to review pending items.
 * Protected by a simple API key check (FEEDBACK_READ_KEY env var).
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const readKey = process.env.FEEDBACK_READ_KEY;
  if (readKey && key !== readKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logPath = path.join(process.cwd(), "feedback-log.json");
    if (!existsSync(logPath)) return NextResponse.json([]);
    const log: FeedbackEntry[] = JSON.parse(readFileSync(logPath, "utf8"));

    // Sort by priority then timestamp
    const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
    log.sort((a, b) => {
      const pa = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const pb = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      return pa !== pb ? pa - pb : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json(log);
  } catch {
    return NextResponse.json({ error: "Could not read feedback log" }, { status: 500 });
  }
}
