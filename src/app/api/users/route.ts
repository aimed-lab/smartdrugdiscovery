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

const VALID_ROLES = ["Owner", "Admin", "TechSupport", "Developer", "User"];
const VALID_STATUSES = ["active", "pending_approval", "rejected", "suspended"];

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

// ── Input validation ────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function sanitizeString(str: unknown, maxLen = 200): string {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
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

/**
 * Write the registry with retry-on-conflict (SHA mismatch → re-read + re-apply).
 * Up to 3 attempts to handle concurrent writes from multiple admin browsers.
 */
async function writeRegistryWithRetry(
  applyFn: (users: RegistryUser[]) => RegistryUser[],
  message: string,
  token: string,
  owner: string,
  repo: string,
  maxRetries = 3,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { users, sha } = await readRegistry(token, owner, repo);
    const updated = applyFn(users);
    const content = Buffer.from(JSON.stringify(updated, null, 2)).toString("base64");
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

    if (res.ok) return true;

    // 409 = SHA conflict (someone else wrote between our read and write)
    if (res.status === 409 && attempt < maxRetries - 1) {
      console.warn(`[user-registry] SHA conflict on attempt ${attempt + 1}, retrying...`);
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      continue;
    }

    console.error("Failed to write user registry:", res.status, await res.text());
    return false;
  }
  return false;
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const email = sanitizeString(body.email, 254).toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }

  const role = sanitizeString(body.role, 20);
  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
  }

  const accountStatus = sanitizeString(body.accountStatus, 30);
  if (accountStatus && !VALID_STATUSES.includes(accountStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid accountStatus" }, { status: 400 });
  }

  const user: RegistryUser = {
    email,
    name: sanitizeString(body.name, 100) || email.split("@")[0],
    role: role || "User",
    accountStatus: accountStatus || "pending_approval",
    invitedBy: sanitizeString(body.invitedBy, 254) || undefined,
    invitedAt: sanitizeString(body.invitedAt, 30) || undefined,
    approvedBy: sanitizeString(body.approvedBy, 254) || undefined,
    approvedAt: sanitizeString(body.approvedAt, 30) || undefined,
    registeredAt: sanitizeString(body.registeredAt, 30) || new Date().toISOString(),
  };

  const ok = await writeRegistryWithRetry(
    (users) => {
      const idx = users.findIndex((u) => u.email.toLowerCase() === email);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...user };
      } else {
        users.push(user);
      }
      return users;
    },
    `user-registry: register ${email}`,
    gh.token, gh.owner, gh.repo,
  );
  return NextResponse.json({ ok });
}

// ── PUT — update a user (approve, reject, suspend, role change) ─────────────

export async function PUT(req: NextRequest) {
  const gh = ghConfig();
  if (!gh.ok) {
    return NextResponse.json({ ok: false, error: "GitHub not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const email = sanitizeString(body.email, 254).toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }

  const role = sanitizeString(body.role, 20);
  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
  }

  const accountStatus = sanitizeString(body.accountStatus, 30);
  if (accountStatus && !VALID_STATUSES.includes(accountStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid accountStatus" }, { status: 400 });
  }

  // Build sanitized update object
  const update: Partial<RegistryUser> = {};
  if (role) update.role = role;
  if (accountStatus) update.accountStatus = accountStatus;
  if (body.approvedBy) update.approvedBy = sanitizeString(body.approvedBy, 254);
  if (body.approvedAt) update.approvedAt = sanitizeString(body.approvedAt, 30);
  if (body.name) update.name = sanitizeString(body.name, 100);

  const ok = await writeRegistryWithRetry(
    (users) => {
      const idx = users.findIndex((u) => u.email.toLowerCase() === email);
      if (idx < 0) {
        // If user doesn't exist server-side, create a minimal record
        users.push({
          email,
          name: update.name || email.split("@")[0],
          role: update.role || "User",
          accountStatus: update.accountStatus || "active",
          approvedBy: update.approvedBy,
          approvedAt: update.approvedAt,
          registeredAt: new Date().toISOString(),
        });
      } else {
        users[idx] = { ...users[idx], ...update };
      }
      return users;
    },
    `user-registry: ${accountStatus ?? "update"} ${email}`,
    gh.token, gh.owner, gh.repo,
  );
  return NextResponse.json({ ok });
}
