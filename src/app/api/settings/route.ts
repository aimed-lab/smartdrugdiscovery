import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";

/**
 * /api/settings — Platform-wide settings backed by Vercel Postgres.
 *
 * GET  ?key=maxActiveUsers  — read a setting
 * PUT  { key, value }       — write a setting
 */

function sanitize(str: unknown, maxLen = 200): string {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

const ALLOWED_KEYS = ["maxActiveUsers"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = sanitize(searchParams.get("key"), 50);
  if (!key || !ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const value = await getSetting(key);
    return NextResponse.json({ key, value });
  } catch (err) {
    console.error("[/api/settings] GET error:", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const key = sanitize(body.key, 50);
  const value = sanitize(body.value, 200);

  if (!key || !ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ ok: false, error: "Invalid key" }, { status: 400 });
  }
  if (!value) {
    return NextResponse.json({ ok: false, error: "Value required" }, { status: 400 });
  }

  try {
    await setSetting(key, value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/settings] PUT error:", err);
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }
}
