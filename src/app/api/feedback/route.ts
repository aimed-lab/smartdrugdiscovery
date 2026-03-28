import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  kind: "image" | "audio" | "file";
}

export type TicketStatus   = "open" | "in-progress" | "resolved" | "closed" | "wont-fix";
export type TicketType     = "bug" | "enhancement" | "idea" | "question" | "praise";
export type TicketPriority = "p0" | "p1" | "p2" | "p3";

export interface FeedbackEntry {
  id: string;
  type: TicketType;
  priority: TicketPriority;
  title: string;
  description: string;
  url: string;
  pageTitle: string;
  user: { name: string; email: string } | null;
  timestamp: string;
  attachments?: Attachment[];
  // ticketing fields
  status: TicketStatus;
  assignedTo?: string;
  resolvedAt?: string;
  resolution?: string;
  // github integration
  githubIssueUrl: string | null;
  githubIssueNumber: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────

const TYPE_EMOJI: Record<TicketType, string> = {
  bug:         "🐛",
  enhancement: "✨",
  idea:        "💡",
  question:    "❓",
  praise:      "🌟",
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  p0: "P0 Critical",
  p1: "P1 High",
  p2: "P2 Medium",
  p3: "P3 Low",
};

const LOG_PATH = path.join(process.cwd(), "feedback-log.json");

// ── Local log helpers ─────────────────────────────────────────────────────

function readLog(): FeedbackEntry[] {
  try {
    if (!existsSync(LOG_PATH)) return [];
    return JSON.parse(readFileSync(LOG_PATH, "utf8")) as FeedbackEntry[];
  } catch {
    return [];
  }
}

function writeLog(entries: FeedbackEntry[]) {
  try {
    writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2), "utf8");
  } catch (err) {
    console.warn("Could not write feedback-log.json:", err);
  }
}

// ── GitHub helpers ────────────────────────────────────────────────────────

async function ensureGitHubLabels(token: string, owner: string, repo: string) {
  const labels = [
    { name: "type:bug",         color: "d73a4a", description: "Bug report" },
    { name: "type:enhancement", color: "0075ca", description: "Enhancement request" },
    { name: "type:idea",        color: "ffd700", description: "New idea" },
    { name: "type:question",    color: "cc317c", description: "Question" },
    { name: "type:praise",      color: "34d058", description: "Positive feedback" },
    { name: "priority:p0",      color: "b60205", description: "Critical — blocking" },
    { name: "priority:p1",      color: "e4e669", description: "High priority" },
    { name: "priority:p2",      color: "0e8a16", description: "Medium priority" },
    { name: "priority:p3",      color: "cfd3d7", description: "Low priority" },
    { name: "feedback",         color: "7057ff", description: "Submitted via feedback widget" },
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
  const repo  = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) return null;

  try {
    await ensureGitHubLabels(token, owner, repo);
    const emoji        = TYPE_EMOJI[entry.type] ?? "📝";
    const priorityLabel = PRIORITY_LABEL[entry.priority] ?? entry.priority.toUpperCase();
    const issueTitle   = `${emoji} [${entry.priority.toUpperCase()}] ${entry.title}`;
    const issueBody    = `## ${emoji} ${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} Report\n\n| Field | Value |\n|-------|-------|\n| **Priority** | ${priorityLabel} |\n| **Submitted by** | ${entry.user?.name ?? "Anonymous"} (${entry.user?.email ?? "unknown"}) |\n| **Page** | \`${entry.url}\` |\n| **Date** | ${new Date(entry.timestamp).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT |\n\n## Summary\n${entry.title}\n\n${entry.description ? `## Details\n${entry.description}\n` : ""}${entry.attachments?.length ? `\n## Attachments\n${entry.attachments.map((a) => `- ${a.kind === "image" ? "🖼️" : a.kind === "audio" ? "🎤" : "📎"} \`${a.name}\` (${a.mimeType})`).join("\n")}\n` : ""}\n---\n*Submitted via SmartDrugDiscovery feedback widget · ID: ${entry.id}*`;

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: issueTitle,
        body:  issueBody,
        labels: [`type:${entry.type}`, `priority:${entry.priority}`, "feedback"],
      }),
    });

    if (!res.ok) {
      console.error("GitHub API error:", res.status, await res.text());
      return null;
    }
    const issue = await res.json() as { html_url: string; number: number };
    return { url: issue.html_url, number: issue.number };
  } catch (err) {
    console.error("GitHub issue creation failed:", err);
    return null;
  }
}

// ── POST /api/feedback — submit a new ticket ──────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type?: string; priority?: string; title?: string; description?: string;
      url?: string; pageTitle?: string;
      user?: { name: string; email: string } | null;
      timestamp?: string;
      attachments?: Attachment[];
    };
    const { type, priority, title, description, url, pageTitle, user, timestamp, attachments } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const entry: FeedbackEntry = {
      id:                `FB-${Date.now()}`,
      type:              (type ?? "bug") as TicketType,
      priority:          (priority ?? "p2") as TicketPriority,
      title:             title.trim(),
      description:       description?.trim() ?? "",
      url:               url ?? "",
      pageTitle:         pageTitle ?? "",
      user:              user ?? null,
      timestamp:         timestamp ?? new Date().toISOString(),
      attachments:       Array.isArray(attachments) ? attachments : [],
      status:            "open",
      githubIssueUrl:    null,
      githubIssueNumber: null,
    };

    const githubResult = await createGitHubIssue(entry);
    if (githubResult) {
      entry.githubIssueUrl    = githubResult.url;
      entry.githubIssueNumber = githubResult.number;
    }

    const log = readLog();
    log.unshift(entry);
    writeLog(log);

    return NextResponse.json({
      success:     true,
      id:          entry.id,
      issueUrl:    entry.githubIssueUrl,
      issueNumber: entry.githubIssueNumber,
    });
  } catch (err) {
    console.error("Feedback submission error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/feedback — list tickets ──────────────────────────────────────

export async function GET(req: NextRequest) {
  const key     = req.nextUrl.searchParams.get("key");
  const readKey = process.env.FEEDBACK_READ_KEY;
  if (readKey && key !== readKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusFilter   = req.nextUrl.searchParams.get("status");
  const typeFilter     = req.nextUrl.searchParams.get("type");
  const priorityFilter = req.nextUrl.searchParams.get("priority");

  let log = readLog();
  if (statusFilter)   log = log.filter((e) => e.status   === statusFilter);
  if (typeFilter)     log = log.filter((e) => e.type     === typeFilter);
  if (priorityFilter) log = log.filter((e) => e.priority === priorityFilter);

  const priorityOrder: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
  log.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 4;
    const pb = priorityOrder[b.priority] ?? 4;
    return pa !== pb ? pa - pb : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return NextResponse.json(log);
}

// ── PATCH /api/feedback — update ticket status ────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as {
      id: string;
      status?: TicketStatus;
      assignedTo?: string;
      resolution?: string;
    };
    const { id, status, assignedTo, resolution } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const log   = readLog();
    const index = log.findIndex((e) => e.id === id);
    if (index === -1) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const entry = { ...log[index] };
    if (status     !== undefined) entry.status     = status;
    if (assignedTo !== undefined) entry.assignedTo = assignedTo;
    if (resolution !== undefined) entry.resolution = resolution;
    if (status === "resolved" || status === "closed") {
      entry.resolvedAt = new Date().toISOString();
    }

    log[index] = entry;
    writeLog(log);
    return NextResponse.json({ success: true, ticket: entry });
  } catch (err) {
    console.error("Feedback PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE /api/feedback — hard-delete a ticket (Admin+) ─────────────────

export async function DELETE(req: NextRequest) {
  const key     = req.nextUrl.searchParams.get("key");
  const readKey = process.env.FEEDBACK_READ_KEY;
  if (readKey && key !== readKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await req.json() as { id: string };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const log    = readLog();
    const newLog = log.filter((e) => e.id !== id);
    if (newLog.length === log.length) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    writeLog(newLog);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
