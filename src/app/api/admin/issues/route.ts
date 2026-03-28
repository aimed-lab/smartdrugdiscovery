import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import path from "path";

interface FeedbackEntry {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  url: string;
  user: { name: string; email: string } | null;
  timestamp: string;
  githubIssueUrl: string | null;
  githubIssueNumber: number | null;
}

const PRIORITY_ORDER: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const githubConfigured = !!(token && owner && repo);

  const items: FeedbackEntry[] = [];

  // Fetch open GitHub Issues tagged "feedback"
  if (githubConfigured) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?labels=feedback&state=open&per_page=50&sort=created&direction=desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const ghIssues = await res.json();
        for (const issue of ghIssues) {
          const typeLabel = issue.labels.find((l: { name: string }) => l.name.startsWith("type:"))?.name;
          const prioLabel = issue.labels.find((l: { name: string }) => l.name.startsWith("priority:"))?.name;
          items.push({
            id: `GH-${issue.number}`,
            type: typeLabel?.replace("type:", "") ?? "bug",
            priority: prioLabel?.replace("priority:", "") ?? "p2",
            title: issue.title.replace(/^[🐛✨💡]\s*\[[^\]]+\]\s*/, ""),
            description: issue.body ?? "",
            url: "",
            user: null,
            timestamp: issue.created_at,
            githubIssueUrl: issue.html_url,
            githubIssueNumber: issue.number,
          });
        }
      }
    } catch (err) {
      console.error("GitHub Issues fetch failed:", err);
    }
  }

  // Merge local feedback-log.json (items not already in GitHub)
  try {
    const logPath = path.join(process.cwd(), "feedback-log.json");
    if (existsSync(logPath)) {
      const log: FeedbackEntry[] = JSON.parse(readFileSync(logPath, "utf8"));
      for (const entry of log) {
        const alreadyIncluded =
          entry.githubIssueNumber &&
          items.some((i) => i.githubIssueNumber === entry.githubIssueNumber);
        if (!alreadyIncluded) items.push(entry);
      }
    }
  } catch { /* ignore */ }

  // Sort by priority then date
  items.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 4;
    const pb = PRIORITY_ORDER[b.priority] ?? 4;
    return pa !== pb
      ? pa - pb
      : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return NextResponse.json({
    items,
    githubConfigured,
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    repo: githubConfigured ? `${owner}/${repo}` : null,
  });
}
