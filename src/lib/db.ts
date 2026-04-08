/**
 * Database layer — Vercel Postgres (Neon) for persistent storage.
 *
 * Auto-creates tables on first call. All queries go through this module
 * so the rest of the app never touches SQL directly.
 *
 * Tables:
 *   users             — registered platform users
 *   invitations       — invite tokens with role assignment
 *   platform_settings — key-value config (e.g. maxActiveUsers)
 */

import { sql, createPool } from "@vercel/postgres";

/**
 * Vercel may set env vars with different prefixes depending on how the
 * database was connected (POSTGRES_URL, STORAGE_URL, DATABASE_URL, etc.).
 * We detect whichever is available and configure the pool accordingly.
 */
function getConnectionString(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL ||
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    undefined
  );
}

// Create a pool with the detected connection string so `sql` works
// even if the env var prefix isn't the default POSTGRES_URL
const connectionString = getConnectionString();
if (connectionString && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = connectionString;
  // Also set the unpooled variant if available
  if (!process.env.POSTGRES_URL_NON_POOLING) {
    process.env.POSTGRES_URL_NON_POOLING =
      process.env.STORAGE_URL_UNPOOLED ||
      process.env.DATABASE_URL_UNPOOLED ||
      connectionString;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface DBUser {
  email: string;
  name: string;
  role: string;
  account_status: string;
  title: string;
  institution: string;
  invited_by: string | null;
  invited_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  registered_at: string;
  updated_at: string;
}

export interface DBInvitation {
  id: string;
  token: string;
  created_by: string;
  assigned_role: string;
  recipient_hint: string | null;
  auto_approve: boolean;
  status: string;
  accepted_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

// ── Schema migration (idempotent) ───────────────────────────────────────────

let _migrated = false;

export async function ensureSchema(): Promise<void> {
  if (_migrated) return;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      email          TEXT PRIMARY KEY,
      name           TEXT NOT NULL DEFAULT '',
      role           TEXT NOT NULL DEFAULT 'User',
      account_status TEXT NOT NULL DEFAULT 'pending_approval',
      title          TEXT NOT NULL DEFAULT '',
      institution    TEXT NOT NULL DEFAULT '',
      invited_by     TEXT,
      invited_at     TIMESTAMPTZ,
      approved_by    TEXT,
      approved_at    TIMESTAMPTZ,
      registered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS invitations (
      id              TEXT PRIMARY KEY,
      token           TEXT UNIQUE NOT NULL,
      created_by      TEXT NOT NULL,
      assigned_role   TEXT NOT NULL DEFAULT 'User',
      recipient_hint  TEXT,
      auto_approve    BOOLEAN NOT NULL DEFAULT FALSE,
      status          TEXT NOT NULL DEFAULT 'pending',
      accepted_by     TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at      TIMESTAMPTZ NOT NULL,
      accepted_at     TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  _migrated = true;
}

// ── User CRUD ───────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<DBUser[]> {
  await ensureSchema();
  const { rows } = await sql<DBUser>`SELECT * FROM users ORDER BY registered_at DESC`;
  return rows;
}

export async function getUserByEmail(email: string): Promise<DBUser | null> {
  await ensureSchema();
  const { rows } = await sql<DBUser>`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
  return rows[0] ?? null;
}

export async function upsertUser(user: Partial<DBUser> & { email: string }): Promise<DBUser> {
  await ensureSchema();
  const email = user.email.toLowerCase();

  const { rows } = await sql<DBUser>`
    INSERT INTO users (email, name, role, account_status, title, institution,
                       invited_by, invited_at, approved_by, approved_at, registered_at, updated_at)
    VALUES (
      ${email},
      ${user.name ?? email.split("@")[0]},
      ${user.role ?? "User"},
      ${user.account_status ?? "pending_approval"},
      ${user.title ?? ""},
      ${user.institution ?? ""},
      ${user.invited_by ?? null},
      ${user.invited_at ?? null},
      ${user.approved_by ?? null},
      ${user.approved_at ?? null},
      ${user.registered_at ?? new Date().toISOString()},
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      name           = COALESCE(NULLIF(${user.name ?? ""}, ''), users.name),
      role           = COALESCE(NULLIF(${user.role ?? ""}, ''), users.role),
      account_status = COALESCE(NULLIF(${user.account_status ?? ""}, ''), users.account_status),
      title          = COALESCE(NULLIF(${user.title ?? ""}, ''), users.title),
      institution    = COALESCE(NULLIF(${user.institution ?? ""}, ''), users.institution),
      invited_by     = COALESCE(${user.invited_by ?? null}, users.invited_by),
      invited_at     = COALESCE(${user.invited_at ?? null}::TIMESTAMPTZ, users.invited_at),
      approved_by    = COALESCE(${user.approved_by ?? null}, users.approved_by),
      approved_at    = COALESCE(${user.approved_at ?? null}::TIMESTAMPTZ, users.approved_at),
      updated_at     = NOW()
    RETURNING *
  `;

  return rows[0];
}

export async function updateUserFields(
  email: string,
  fields: Partial<Pick<DBUser, "role" | "account_status" | "approved_by" | "approved_at" | "name" | "title" | "institution">>,
): Promise<DBUser | null> {
  await ensureSchema();
  const lowerEmail = email.toLowerCase();

  // Build dynamic update — only set provided fields
  const sets: string[] = [];
  const values: unknown[] = [];

  if (fields.role !== undefined) { sets.push("role = $" + (values.length + 1)); values.push(fields.role); }
  if (fields.account_status !== undefined) { sets.push("account_status = $" + (values.length + 1)); values.push(fields.account_status); }
  if (fields.approved_by !== undefined) { sets.push("approved_by = $" + (values.length + 1)); values.push(fields.approved_by); }
  if (fields.approved_at !== undefined) { sets.push("approved_at = $" + (values.length + 1)); values.push(fields.approved_at); }
  if (fields.name !== undefined) { sets.push("name = $" + (values.length + 1)); values.push(fields.name); }
  if (fields.title !== undefined) { sets.push("title = $" + (values.length + 1)); values.push(fields.title); }
  if (fields.institution !== undefined) { sets.push("institution = $" + (values.length + 1)); values.push(fields.institution); }

  if (sets.length === 0) return getUserByEmail(lowerEmail);

  sets.push("updated_at = NOW()");

  // Use tagged template for simple cases, raw query for dynamic updates
  // Since @vercel/postgres doesn't support dynamic column sets easily,
  // we use specific update queries based on what's being updated
  const { rows } = await sql<DBUser>`
    UPDATE users SET
      role = COALESCE(${fields.role ?? null}, role),
      account_status = COALESCE(${fields.account_status ?? null}, account_status),
      approved_by = COALESCE(${fields.approved_by ?? null}, approved_by),
      approved_at = COALESCE(${fields.approved_at ?? null}::TIMESTAMPTZ, approved_at),
      name = COALESCE(NULLIF(${fields.name ?? ""}, ''), name),
      title = COALESCE(NULLIF(${fields.title ?? ""}, ''), title),
      institution = COALESCE(NULLIF(${fields.institution ?? ""}, ''), institution),
      updated_at = NOW()
    WHERE email = ${lowerEmail}
    RETURNING *
  `;

  return rows[0] ?? null;
}

export async function getActiveUserCount(): Promise<number> {
  await ensureSchema();
  const { rows } = await sql`SELECT COUNT(*) as count FROM users WHERE account_status = 'active'`;
  return Number(rows[0]?.count ?? 0);
}

// ── Invitation CRUD ─────────────────────────────────────────────────────────

export async function getAllInvitations(): Promise<DBInvitation[]> {
  await ensureSchema();
  const { rows } = await sql<DBInvitation>`SELECT * FROM invitations ORDER BY created_at DESC`;
  return rows;
}

export async function getInvitationsByCreator(email: string): Promise<DBInvitation[]> {
  await ensureSchema();
  const { rows } = await sql<DBInvitation>`
    SELECT * FROM invitations WHERE created_by = ${email.toLowerCase()} ORDER BY created_at DESC
  `;
  return rows;
}

export async function getInvitationByToken(token: string): Promise<DBInvitation | null> {
  await ensureSchema();
  const upper = token.trim().toUpperCase();
  const { rows } = await sql<DBInvitation>`
    SELECT * FROM invitations WHERE UPPER(token) = ${upper}
  `;
  return rows[0] ?? null;
}

export async function createInvitation(inv: Omit<DBInvitation, "accepted_at" | "accepted_by"> & { accepted_at?: string | null; accepted_by?: string | null }): Promise<DBInvitation> {
  await ensureSchema();
  const { rows } = await sql<DBInvitation>`
    INSERT INTO invitations (id, token, created_by, assigned_role, recipient_hint,
                             auto_approve, status, expires_at, created_at)
    VALUES (${inv.id}, ${inv.token}, ${inv.created_by.toLowerCase()}, ${inv.assigned_role},
            ${inv.recipient_hint ?? null}, ${inv.auto_approve}, ${inv.status},
            ${inv.expires_at}, ${inv.created_at ?? new Date().toISOString()})
    RETURNING *
  `;
  return rows[0];
}

export async function redeemInvitation(token: string, acceptedBy: string): Promise<DBInvitation | null> {
  await ensureSchema();
  const upper = token.trim().toUpperCase();
  const { rows } = await sql<DBInvitation>`
    UPDATE invitations SET
      status = 'accepted',
      accepted_by = ${acceptedBy.toLowerCase()},
      accepted_at = NOW()
    WHERE UPPER(token) = ${upper} AND status = 'pending'
    RETURNING *
  `;
  return rows[0] ?? null;
}

export async function revokeInvitation(id: string): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE invitations SET status = 'revoked' WHERE id = ${id} AND status = 'pending'
  `;
  return (rowCount ?? 0) > 0;
}

export async function countPendingInvitations(email: string): Promise<number> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT COUNT(*) as count FROM invitations
    WHERE created_by = ${email.toLowerCase()}
      AND status = 'pending'
      AND expires_at > NOW()
  `;
  return Number(rows[0]?.count ?? 0);
}

// ── Platform settings ───────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT value FROM platform_settings WHERE key = ${key}`;
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO platform_settings (key, value, updated_at) VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
  `;
}
