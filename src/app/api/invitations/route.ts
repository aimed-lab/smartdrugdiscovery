import { NextRequest, NextResponse } from "next/server";
import {
  getAllInvitations, getInvitationsByCreator, getInvitationByToken,
  createInvitation, redeemInvitation, revokeInvitation,
  countPendingInvitations,
} from "@/lib/db";

/**
 * /api/invitations — Server-side invitation management backed by Vercel Postgres.
 *
 * GET    — list invitations (all for admin, own for regular users)
 * POST   — create a new invitation
 * PUT    — redeem an invitation (token → accepted)
 * DELETE — revoke a pending invitation
 */

const VALID_ROLES = ["Owner", "Admin", "TechSupport", "Developer", "User"];

function sanitize(str: unknown, maxLen = 200): string {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

// ── GET — list invitations ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = sanitize(searchParams.get("email"), 254).toLowerCase();
  const scope = searchParams.get("scope"); // "all" for admin view

  try {
    const invitations = scope === "all"
      ? await getAllInvitations()
      : email
        ? await getInvitationsByCreator(email)
        : [];
    return NextResponse.json({ invitations });
  } catch (err) {
    console.error("[/api/invitations] GET error:", err);
    return NextResponse.json({ invitations: [], error: "Database unavailable" }, { status: 503 });
  }
}

// ── POST — create a new invitation ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const id = sanitize(body.id, 30);
  const token = sanitize(body.token, 10).toUpperCase();
  const createdBy = sanitize(body.createdBy, 254).toLowerCase();
  const assignedRole = sanitize(body.assignedRole, 20);
  const recipientHint = sanitize(body.recipientHint, 200) || null;
  const autoApprove = body.autoApprove === true;
  const expiresAt = sanitize(body.expiresAt, 30);

  if (!id || !token || !createdBy || !assignedRole || !expiresAt) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }
  if (!VALID_ROLES.includes(assignedRole)) {
    return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
  }

  try {
    const invitation = await createInvitation({
      id,
      token,
      created_by: createdBy,
      assigned_role: assignedRole,
      recipient_hint: recipientHint,
      auto_approve: autoApprove,
      status: "pending",
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, invitation });
  } catch (err) {
    console.error("[/api/invitations] POST error:", err);
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }
}

// ── PUT — redeem / validate a token ─────────────────────────────────────────

export async function PUT(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const action = sanitize(body.action, 20);

  // Action: "validate" — check if a token is valid without redeeming
  if (action === "validate") {
    const token = sanitize(body.token, 10).toUpperCase();
    if (!token) return NextResponse.json({ ok: false, error: "Token required" }, { status: 400 });

    try {
      const inv = await getInvitationByToken(token);
      if (!inv) return NextResponse.json({ ok: false, valid: false, error: "Token not found" });
      if (inv.status !== "pending") return NextResponse.json({ ok: false, valid: false, error: `Token already ${inv.status}` });
      if (new Date(inv.expires_at) < new Date()) return NextResponse.json({ ok: false, valid: false, error: "Token expired" });
      return NextResponse.json({
        ok: true, valid: true,
        assignedRole: inv.assigned_role,
        autoApprove: inv.auto_approve,
        createdBy: inv.created_by,
      });
    } catch (err) {
      console.error("[/api/invitations] validate error:", err);
      return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
    }
  }

  // Action: "redeem" — accept a token
  if (action === "redeem") {
    const token = sanitize(body.token, 10).toUpperCase();
    const acceptedBy = sanitize(body.acceptedBy, 254).toLowerCase();
    if (!token || !acceptedBy) {
      return NextResponse.json({ ok: false, error: "Token and acceptedBy required" }, { status: 400 });
    }

    try {
      const inv = await redeemInvitation(token, acceptedBy);
      if (!inv) return NextResponse.json({ ok: false, error: "Token not found or already used" });
      return NextResponse.json({ ok: true, invitation: inv });
    } catch (err) {
      console.error("[/api/invitations] redeem error:", err);
      return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

// ── DELETE — revoke a pending invitation ────────────────────────────────────

export async function DELETE(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const id = sanitize(body.id, 30);
  if (!id) {
    return NextResponse.json({ ok: false, error: "Invitation id required" }, { status: 400 });
  }

  try {
    const ok = await revokeInvitation(id);
    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[/api/invitations] DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }
}
