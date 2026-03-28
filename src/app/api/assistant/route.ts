import { NextRequest, NextResponse } from "next/server";

// Rate limit: free tier gets 5 questions per session (enforced client-side; server trusts header)
// Paid/Owner/Admin: unlimited (role sent in request body)

const SYSTEM_PROMPT = `You are the SmartDrugDiscovery platform assistant — an expert in both the platform itself and AI-assisted drug discovery (AIDD 2.0).

You help users:
1. Navigate the platform (Projects, Foundation Models, Tool Plugins, Add-on Services, Settings)
2. Understand roles and permissions (Owner, Admin, Developer, User)
3. Use MCP tool integrations (ChEMBL, PubMed, Talent KG, HuggingFace, Kaggle)
4. Answer drug discovery science questions when relevant
5. Log feedback, bugs, and ideas (direct the user to the Feedback tab)

Key platform facts:
- Version: 1.109 (check About tab in Settings for latest)
- Roles: Owner > Admin > Developer > User. Owner role is locked — transfer requires 24-hr cooling-off.
- Persistence: localStorage (client-side). Supabase/Prisma DB integration is planned.
- AI Chat uses Anthropic Claude (ANTHROPIC_API_KEY set as Vercel env var).
- MCP servers: ChEMBL (6 tools), PubMed, Open Targets, Talent KG, HuggingFace Hub, Kaggle.
- Foundation Models: Claude Opus 4, Claude Sonnet 4.5, GPT-4o, Gemini 2.5 Pro, Llama 3.3 70B (Groq), Mistral Large 2, Drug-GPT, BioGPT.
- Projects have A.G.E. scores (Activity · Goal · Execution).
- Docs: /docs/ directory in the GitHub repo — roles, architecture, ownership transfer, API reference.

Be concise, helpful, and accurate. When unsure, say so. For sensitive actions (deleting data, changing roles, financial info) always confirm before proceeding.`;

export async function POST(req: NextRequest) {
  try {
    const { question, pageContext, role, history = [] } = await req.json() as {
      question: string;
      pageContext?: string;
      role?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { answer: "AI assistant is not configured (ANTHROPIC_API_KEY missing). Please contact your platform administrator." },
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json(
        { answer: "Sorry, I couldn't reach the AI service right now. Please try again shortly." },
        { status: 200 }
      );
    }

    const data = await response.json() as {
      content: { type: string; text: string }[];
    };
    const answer = data.content.find((c) => c.type === "text")?.text ?? "No response.";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Assistant route error:", err);
    return NextResponse.json(
      { answer: "An unexpected error occurred. Please try again." },
      { status: 200 }
    );
  }
}
