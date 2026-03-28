import { NextRequest, NextResponse } from "next/server";

// Rate limit: free tier gets 5 questions per session (enforced client-side; server trusts header)
// Paid/Owner/Admin: unlimited (role sent in request body)

const SYSTEM_PROMPT = `You are the SmartDrugDiscovery platform assistant — an expert in both the platform itself and AI-assisted drug discovery (AIDD 2.0).

You help users:
1. Navigate the platform (Projects, Foundation Models, Tool Plugins, Add-on Services, Settings)
2. Understand roles and permissions (Owner, Admin, TechSupport, Developer, User)
3. Use MCP tool integrations (ChEMBL, PubMed, Talent KG, HuggingFace, Kaggle)
4. Answer drug discovery science questions when relevant
5. Log feedback, bugs, and ideas (direct the user to the Feedback tab)

Key platform facts:
- Version: 1.123 (check About tab in Settings for latest)
- Roles: Owner > Admin > TechSupport > Developer > User. Owner role is locked — transfer requires 24-hr cooling-off.
- Persistence: localStorage (client-side). Supabase/Prisma DB integration is planned.
- AI Chat uses Anthropic Claude (ANTHROPIC_API_KEY set as Vercel env var, or entered in Settings → API Keys).
- MCP servers: ChEMBL (6 tools), PubMed, Open Targets, Talent KG, HuggingFace Hub, Kaggle.
- Foundation Models: Claude Opus 4, Claude Sonnet 4.5, GPT-4o, Gemini 2.5 Pro, Llama 3.3 70B (Groq), Mistral Large 2, Drug-GPT, BioGPT.
- Projects have A.G.E. scores (Activity · Goal · Execution).
- Docs: /docs/ directory in the GitHub repo — roles, architecture, ownership transfer, API reference.
- Security & Compliance page: /security (Admin/Developer only).
- Support Dashboard: /support (TechSupport+ only).
- Access Control (RBAC module visibility): Settings → Access Control tab (Admin/Owner only).

Be concise, helpful, and accurate. When unsure, say so. For sensitive actions (deleting data, changing roles, financial info) always confirm before proceeding.`;

/** Friendly diagnostic messages for HTTP errors from Anthropic. */
function anthropicErrorMessage(status: number, body: string): string {
  if (status === 401) {
    return "❌ **Invalid API key** — your Anthropic API key was rejected. Please check Settings → API Keys and make sure you've entered a valid `sk-ant-...` key, then save it.";
  }
  if (status === 403) {
    return "❌ **Access denied** — your API key doesn't have permission to use this model. Check your Anthropic account plan.";
  }
  if (status === 404) {
    return "❌ **Model not found** — the requested model isn't available on your account. Try using a different Foundation Model in Settings.";
  }
  if (status === 429) {
    return "⏳ **Rate limit reached** — too many requests. Please wait a moment and try again.";
  }
  if (status === 529 || status === 503) {
    return "⏳ **Anthropic service temporarily unavailable** — please try again in a few seconds.";
  }
  // Try to parse a useful message from the body
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed?.error?.message) {
      return `⚠️ API error: ${parsed.error.message}`;
    }
  } catch { /* ignore */ }
  return `⚠️ Anthropic API returned HTTP ${status}. Please check your API key in Settings → API Keys.`;
}

export async function POST(req: NextRequest) {
  try {
    const { question, pageContext, role, history = [], apiKey: clientKey } = await req.json() as {
      question: string;
      pageContext?: string;
      role?: string;
      history?: { role: "user" | "assistant"; content: string }[];
      /** Optional: client-provided API key (from localStorage → Settings → API Keys).
       *  Used as fallback when ANTHROPIC_API_KEY env var is not set. */
      apiKey?: string;
    };

    if (!question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    // Prefer server env var; fall back to key passed from the client
    const apiKey = process.env.ANTHROPIC_API_KEY || clientKey?.trim() || "";

    if (!apiKey) {
      return NextResponse.json(
        {
          answer: "⚙️ **AI assistant not configured** — no Anthropic API key found.\n\n" +
            "To fix this:\n" +
            "1. Go to **Settings → API Keys**\n" +
            "2. Enter your `sk-ant-...` key in the Anthropic field\n" +
            "3. Click **Save API Keys**\n\n" +
            "Your key is stored locally in your browser and sent securely over HTTPS. " +
            "For production, set `ANTHROPIC_API_KEY` as a Vercel environment variable instead.",
        },
        { status: 200 }
      );
    }

    // Build messages: history + current question
    const messages = [
      ...history.slice(-6), // keep last 3 turns for context
      {
        role: "user" as const,
        content: pageContext
          ? `[Current page: ${pageContext}]\n\n${question}`
          : question,
      },
    ];

    // Try the requested model, with automatic fallback chain
    const modelCandidates = [
      "claude-sonnet-4-5",
      "claude-3-5-sonnet-20241022",
      "claude-3-haiku-20240307",
    ];

    let lastStatus = 0;
    let lastBody   = "";

    for (const model of modelCandidates) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 800,
          system: SYSTEM_PROMPT,
          messages,
        }),
      });

      lastStatus = response.status;

      if (response.ok) {
        const data = await response.json() as {
          content: { type: string; text: string }[];
        };
        const answer = data.content.find((c) => c.type === "text")?.text ?? "No response.";
        return NextResponse.json({ answer, model });
      }

      lastBody = await response.text();

      // 401 / 403 = auth error — no point trying other models
      if (response.status === 401 || response.status === 403) break;
      // 404 = model not available — try next in chain
      if (response.status === 404) continue;
      // Other errors — break and report
      break;
    }

    console.error(`Anthropic API error (${lastStatus}):`, lastBody);
    return NextResponse.json(
      { answer: anthropicErrorMessage(lastStatus, lastBody) },
      { status: 200 }
    );
  } catch (err) {
    console.error("Assistant route error:", err);
    return NextResponse.json(
      { answer: "An unexpected error occurred. Please try again." },
      { status: 200 }
    );
  }
}

/** GET /api/assistant — connection health check */
export async function GET(req: NextRequest) {
  const clientKey = req.nextUrl.searchParams.get("key") ?? "";
  const apiKey = process.env.ANTHROPIC_API_KEY || clientKey.trim();

  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "no_key" });
  }

  // Cheapest possible call to verify the key
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 5,
      messages: [{ role: "user", content: "hi" }],
    }),
  });

  if (res.ok) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false, status: res.status });
}
