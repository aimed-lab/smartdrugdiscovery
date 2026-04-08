import { NextRequest, NextResponse } from "next/server";
import {
  getInvitationByToken, redeemInvitation as dbRedeemInvitation,
} from "@/lib/db";
import { upsertUser } from "@/lib/db";

/**
 * /api/join — Single server-side endpoint that handles the ENTIRE signup flow:
 *
 * 1. Validate the invite token in Postgres
 * 2. Redeem it (mark as accepted)
 * 3. Create/update the user record with proper status
 * 4. Return the complete user object
 *
 * This replaces the fragile client-side localStorage validation.
 * The client only needs to POST { email, token } and gets back either
 * a user object or an error.
 */

function sanitize(str: unknown, maxLen = 254): string {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = sanitize(body.email).toLowerCase();
  const token = sanitize(body.token, 20).toUpperCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }
  if (!token) {
    return NextResponse.json({ ok: false, error: "Invitation token required" }, { status: 400 });
  }

  // Handle legacy seed token
  if (token === "SPARC2026") {
    const user = await upsertUser({
      email,
      role: "Developer",
      account_status: "active",
      invited_by: "system",
      invited_at: new Date().toISOString(),
      approved_by: "auto",
      approved_at: new Date().toISOString(),
    });
    return NextResponse.json({
      ok: true,
      user: mapUser(user),
      autoApproved: true,
    });
  }

  try {
    // 1. Find the invitation in Postgres
    const inv = await getInvitationByToken(token);
    if (!inv) {
      return NextResponse.json({ ok: false, error: "Invalid invitation code. Please check and try again." }, { status: 404 });
    }

    // Check expiry
    if (new Date(inv.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, error: "This invitation has expired. Please request a new one." }, { status: 410 });
    }

    // Check if already used
    if (inv.status !== "pending") {
      return NextResponse.json({ ok: false, error: `This invitation has already been ${inv.status}.` }, { status: 409 });
    }

    // 2. Redeem the invitation
    const redeemed = await dbRedeemInvitation(token, email);
    if (!redeemed) {
      return NextResponse.json({ ok: false, error: "Failed to redeem invitation. It may have been used by someone else." }, { status: 409 });
    }

    // 3. Determine account status
    const autoApprove = redeemed.auto_approve;
    const accountStatus = autoApprove ? "active" : "pending_approval";

    // 4. Create/update user in Postgres
    const user = await upsertUser({
      email,
      role: redeemed.assigned_role,
      account_status: accountStatus,
      invited_by: redeemed.created_by,
      invited_at: new Date().toISOString(),
      ...(autoApprove ? {
        approved_by: "auto",
        approved_at: new Date().toISOString(),
      } : {}),
    });

    return NextResponse.json({
      ok: true,
      user: mapUser(user),
      autoApproved: autoApprove,
    });
  } catch (err) {
    console.error("[/api/join] Error:", err);
    return NextResponse.json({ ok: false, error: "Server error. Please try again." }, { status: 500 });
  }
}

/** Map snake_case DB user to camelCase for client */
function mapUser(u: { email: string; name: string; role: string; account_status: string; invited_by: string | null; invited_at: string | null; approved_by: string | null; approved_at: string | null; title: string; institution: string }) {
  return {
    email: u.email,
    name: u.name,
    role: u.role,
    accountStatus: u.account_status,
    title: u.title,
    institution: u.institution,
    invitedBy: u.invited_by,
    invitedAt: u.invited_at,
    approvedBy: u.approved_by,
    approvedAt: u.approved_at,
  };
}
