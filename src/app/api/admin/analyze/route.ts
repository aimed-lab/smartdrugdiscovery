import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

async function fetchFileFromGitHub(filePath: string): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) return null;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.encoding !== "base64") return null;
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const { issue, filePaths } = await req.json();

  // Fetch requested files
  const files: { path: string; content: string }[] = [];
  await Promise.all(
    (filePaths as string[]).map(async (fp) => {
      const content = await fetchFileFromGitHub(fp);
      if (content) files.push({ path: fp, content });
    })
  );

  const filesSection = files.length
    ? files.map((f) => `=== ${f.path} ===\n${f.content}`).join("\n\n---\n\n")
    : "No files were fetched. You may need more files — list them in needsFiles.";

  const prompt = `You are an expert Next.js/TypeScript developer maintaining SmartDrugDiscovery, a drug discovery AI platform built with Next.js, Tailwind CSS, and Radix UI.

FEEDBACK ITEM TO RESOLVE:
- ID: ${issue.id}
- Type: ${issue.type}
- Priority: ${issue.priority.toUpperCase()}
- Summary: ${issue.title}
- Details: ${issue.description || "None provided"}
- Page: ${issue.url || "Not specified"}
- Submitted: ${new Date(issue.timestamp).toLocaleString()}

CODEBASE FILES PROVIDED:
${filesSection}

Analyze this feedback item and propose the minimal code changes needed to resolve it.

Respond with ONLY valid JSON (no markdown fences, no text outside JSON):
{
  "analysis": "2-3 sentence root cause analysis and your approach",
  "effort": "small|medium|large",
  "changes": [
    {
      "file": "src/path/to/file.tsx",
      "description": "What this specific change does and why",
      "search": "EXACT verbatim multi-line code block from the file to replace — must be unique and copy-pasted verbatim from the file content above",
      "replace": "the new code to put in its place"
    }
  ],
  "reasoning": "One sentence on why these changes fully address the issue",
  "commitMessage": "Fix: short imperative description (e.g. Fix mobile nav close on link tap)"
}

Rules:
- "search" MUST be verbatim text found in the file — copy it exactly including indentation and whitespace
- Make "search" long enough to be unique in the file (at least 3 lines where possible)
- Only include files that need changes — do not include unchanged files
- Keep changes minimal and focused on the reported issue
- If the issue cannot be fixed with the provided files, return "changes": [] and list needed files in "needsFiles": ["path/to/file.tsx"]
- If no code change is needed, return "changes": [] with an explanation in "analysis"`;

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8096,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    return NextResponse.json({ error: "Unexpected Claude response type" }, { status: 500 });
  }

  // Strip markdown fences if present
  let jsonText = block.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return NextResponse.json(JSON.parse(jsonText));
  } catch {
    return NextResponse.json({ error: "Failed to parse Claude response", raw: block.text }, { status: 500 });
  }
}
