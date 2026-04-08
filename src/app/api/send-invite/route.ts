import { NextRequest, NextResponse } from "next/server";

/**
 * /api/send-invite — Send an invitation email via Resend.
 *
 * POST body: { to, inviteLink, role, inviterName }
 *
 * Requires RESEND_API_KEY env var. If not set, returns a
 * helpful error so the admin knows what to configure.
 */

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const to = String(body.to ?? "").trim().toLowerCase();
  const inviteLink = String(body.inviteLink ?? "").trim();
  const role = String(body.role ?? "User").trim();
  const inviterName = String(body.inviterName ?? "Your administrator").trim();

  if (!to || !to.includes("@")) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }
  if (!inviteLink) {
    return NextResponse.json({ ok: false, error: "Invite link required" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "RESEND_API_KEY not configured. Add it in Vercel → Settings → Environment Variables." },
      { status: 503 },
    );
  }

  // Determine sender — use verified domain if available, else Resend sandbox
  const fromDomain = process.env.RESEND_FROM_DOMAIN; // e.g. "smartdrugdiscovery.org"
  const from = fromDomain
    ? `SmartDrugDiscovery <noreply@${fromDomain}>`
    : `SmartDrugDiscovery <onboarding@resend.dev>`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `You're invited to join SmartDrugDiscovery`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: #166534; color: white; font-weight: bold; font-size: 18px; line-height: 48px; text-align: center;">SD</div>
            <h1 style="margin: 16px 0 4px; font-size: 22px; color: #111;">SmartDrugDiscovery</h1>
            <p style="margin: 0; font-size: 12px; color: #888; letter-spacing: 2px; text-transform: uppercase;">faster &middot; cheaper &middot; personalized</p>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px; font-size: 15px; color: #333;">Hi,</p>
            <p style="margin: 0 0 12px; font-size: 15px; color: #333;"><strong>${inviterName}</strong> has invited you to join the SmartDrugDiscovery platform as a <strong>${role}</strong>.</p>
            <p style="margin: 0 0 20px; font-size: 15px; color: #333;">Click the button below to accept your invitation:</p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${inviteLink}" style="display: inline-block; background: #166534; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">Accept Invitation</a>
            </div>

            <p style="margin: 16px 0 0; font-size: 12px; color: #888;">Or copy this link: <a href="${inviteLink}" style="color: #166534; word-break: break-all;">${inviteLink}</a></p>
          </div>

          <p style="font-size: 12px; color: #aaa; text-align: center;">This invitation expires in 14 days.</p>
          <p style="font-size: 12px; color: #aaa; text-align: center;">AIDD 2.0 — Multi-scale, Parallel, Evidence-driven Drug Discovery</p>
        </div>
      `,
    });

    if (error) {
      console.error("[/api/send-invite] Resend error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/send-invite] Error:", err);
    return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
  }
}
