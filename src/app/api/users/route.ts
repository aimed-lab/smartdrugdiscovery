import { NextRequest, NextResponse } from "next/server";

/**
 * /api/users — Shared user registry stored as `data/user-registry.json` in
 * the GitHub repository. Bridges the localStorage-per-browser gap so admins
 * can see users who registered on other browsers.
 *
 * GET  — returns all registered users
 * POST — register/update a user (called on login for new users)
 * PUT  — update a user record (called on approve/reject/suspend/role change)
 */

const REGISTRY_PATH = "data/user-registry.json";

interface RegistryUser {
  email: string;
  name: string;
  role: string;
  accountStatus: string;
  invitedBy?: string;
  invitedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  registeredAt: string;
}

// ── GitHub helpers ───────────────────────────────────────────────────────────

function ghConfig() {
  const token = process.env.GITHUB_TOKEN ?? "";
  const owner = process.env.GITHUB_OWNER ?? "";
  const repo  = process.env.GITHUB_REPO ?? "";
  return { token, owner, repo, ok: !!(token && owner && repo) };
}

async function readRegistry(token: string, owner: string, repo: string): Promise<{ users: RegistryUser[]; sha: string | null }> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${REGISTRY_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return { users: [], sha: null };
  const data = await res.json();
  try {
    const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
    return { users: JSON.parse(content), sha: data.sha };
  } catch {
    return { users: [], sha: data.sha };
  }
}

async function writeRegistry(users: RegistryUser[], sha: string | null, message: string, token: string, owner: string, repo: string): Promise<boolean> {
  const content = Buffer.from(JSON.stringify(users, null, 2)).toString("base64");
  const body: Record<string, unknown> = { message, content };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${REGISTRY_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    console.error("Failed to write user registry:", res.status, await res.text());
    return false;
  }
  return true;
}

// ── GET — fetch all users ────────────────────────────────────────────────────

export async function GET() {
  const gh = ghConfig();
  if (!gh.ok) {
    return NextResponse.json({ users: [], source: "none", error: "GitHub not configured" });
  }
  const { users } = await readRegistry(gh.token, gh.owner, gh.repo);
  return NextResponse.json({ users, source: "github" });
}

// ── POST — register a new user ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const gh = ghConfig();
  if (!gh.ok) {
    return NextResponse.json({ ok: false, error: "GitHub not configured" }, { status: 503 });
  }

  const user = await req.json() as RegistryUser;
  if (!user.email) {
    return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  }

  const { users, sha } = await readRegistry(gh.token, gh.owner, gh.repo);

  // Upsert — update if exists, insert if new
  const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push({ ...user, registeredAt: user.registeredAt || new Date().toISOString() });
  }

  const ok = await writeRegistry(users, sha, `user-registry: register ${user.email}`, gh.token, gh.owner, gh.repo);
  return NextResponse.json({ ok });
}

// ── PUT — update a user (approve, reject, suspend, role change) ─────────────

export async function PUT(req: NextRequest) {
  const gh = ghConfig();
  if (!gh.ok) {
    return NextResponse.json({ ok: false, error: "GitHub not configured" }, { status: 503 });
  }

  const update = await req.json() as Partial<RegistryUser> & { email: string };
  if (!update.email) {
    return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  }

  const { users, sha } = await readRegistry(gh.token, gh.owner, gh.repo);
  const idx = users.findIndex((u) => u.email.toLowerCase() === update.email.toLowerCase());

  if (idx < 0) {
    return NextResponse.json({ ok: false, error: "user not found" }, { status: 404 });
  }

  users[idx] = { ...users[idx], ...update };

  const action = update.accountStatus ?? "update";
  const ok = await writeRegistry(users, sha, `user-registry: ${action} ${update.email}`, gh.token, gh.owner, gh.repo);
  return NextResponse.json({ ok });
}
