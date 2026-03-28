import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/oauth-popup?service=notion&name=Notion&color=%23000000
 *
 * Returns an HTML page that simulates an OAuth consent screen.
 * After a short delay it posts a message to window.opener and closes.
 *
 * In production you would redirect to the real OAuth provider here
 * (e.g. https://api.notion.com/v1/oauth/authorize?...) and handle the
 * callback via /api/oauth-callback/[service]/route.ts.
 */
export async function GET(req: NextRequest) {
  const service  = req.nextUrl.searchParams.get("service")  ?? "unknown";
  const name     = req.nextUrl.searchParams.get("name")     ?? service;
  const colorRaw = req.nextUrl.searchParams.get("color")    ?? "#4f46e5";
  const logoTxt  = req.nextUrl.searchParams.get("logo")     ?? name.slice(0, 2).toUpperCase();

  // Very minimal HTML — no external resources, fully self-contained
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Connect ${name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.08);
      max-width: 420px; width: 100%;
      padding: 40px 32px 32px;
      text-align: center;
    }
    .logo {
      width: 64px; height: 64px;
      background: ${colorRaw};
      border-radius: 14px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 700; color: #fff;
      margin-bottom: 20px;
    }
    h1 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    p  { font-size: .875rem; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .perms {
      background: #f1f5f9; border-radius: 10px;
      padding: 16px; margin-bottom: 24px;
      text-align: left;
    }
    .perms h2 { font-size: .75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 10px; }
    .perm { font-size: .8rem; color: #334155; display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .perm::before { content: "✓"; color: #22c55e; font-weight: 700; flex-shrink: 0; }
    .btn {
      display: block; width: 100%; padding: 12px;
      border-radius: 10px; font-size: .9rem; font-weight: 600;
      cursor: pointer; border: none; transition: opacity .15s;
    }
    .btn:hover { opacity: .88; }
    .btn-primary { background: ${colorRaw}; color: #fff; margin-bottom: 10px; }
    .btn-ghost   { background: transparent; color: #64748b; border: 1px solid #cbd5e1; }
    .footer { font-size: .7rem; color: #94a3b8; margin-top: 20px; }
    .spinner { display: none; }
    .spinner.active {
      display: inline-block; width: 20px; height: 20px;
      border: 3px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .6s linear infinite;
      vertical-align: middle; margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
<div class="card">
  <div class="logo">${logoTxt}</div>
  <h1>Connect to ${name}</h1>
  <p>SmartDrugDiscovery is requesting permission to access your ${name} account with minimal permissions.</p>
  <div class="perms">
    <h2>Permissions requested</h2>
    <div class="perm">Read/write only the files and pages you select</div>
    <div class="perm">No access to your full account or inbox</div>
    <div class="perm">You can revoke access at any time</div>
  </div>
  <button id="allow" class="btn btn-primary" onclick="authorize()">
    <span class="spinner" id="spin"></span>
    Authorize SmartDrugDiscovery
  </button>
  <button class="btn btn-ghost" onclick="deny()">Cancel</button>
  <p class="footer">This is a simulated OAuth consent screen.<br>No real credentials are transmitted.</p>
</div>
<script>
  function authorize() {
    document.getElementById('spin').classList.add('active');
    document.getElementById('allow').disabled = true;
    document.getElementById('allow').textContent = '';
    document.getElementById('allow').prepend(document.getElementById('spin'));
    document.getElementById('allow').append(' Authorizing…');
    setTimeout(() => {
      try {
        window.opener && window.opener.postMessage({
          type:    'oauth-complete',
          service: '${service}',
          name:    '${name}',
          account: 'demo@smartdrugdiscovery.ai',
          token:   'mock_token_' + Math.random().toString(36).slice(2),
        }, window.location.origin);
      } catch (e) { /* cross-origin guard */ }
      window.close();
    }, 1400);
  }
  function deny() {
    try {
      window.opener && window.opener.postMessage({ type: 'oauth-denied', service: '${service}' }, window.location.origin);
    } catch(e) {}
    window.close();
  }
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
