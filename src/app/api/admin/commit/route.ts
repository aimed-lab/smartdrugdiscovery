import { NextRequest, NextResponse } from "next/server";

interface Change {
  file: string;
  description: string;
  search: string;
  replace: string;
}

interface GitHubFileData {
  sha: string;
  content: string;
}

async function getFile(
  filePath: string,
  token: string,
  owner: string,
  repo: string
): Promise<GitHubFileData | null> {
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
  const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { sha: data.sha, content };
}

async function putFile(
  filePath: string,
  newContent: string,
  sha: string,
  commitMessage: string,
  token: string,
  owner: string,
  repo: string
): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(newContent).toString("base64"),
        sha,
      }),
    }
  );
  if (!res.ok) {
    console.error("GitHub PUT failed:", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.commit?.html_url ?? null;
}

async function closeGitHubIssue(
  issueNumber: number,
  token: string,
  owner: string,
  repo: string
) {
  await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: "closed", state_reason: "completed" }),
    }
  );
}

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return NextResponse.json(
      { error: "GitHub credentials not configured (GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO)" },
      { status: 503 }
    );
  }

  const { changes, commitMessage, issueNumber } = await req.json();

  const fullCommitMessage = [
    commitMessage,
    issueNumber ? `\nCloses #${issueNumber}` : "",
    "\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
  ]
    .filter(Boolean)
    .join("");

  const results: {
    file: string;
    success: boolean;
    error?: string;
    commitUrl?: string;
  }[] = [];

  for (const change of changes as Change[]) {
    const fileData = await getFile(change.file, token, owner, repo);

    if (!fileData) {
      results.push({ file: change.file, success: false, error: "Could not fetch file from GitHub" });
      continue;
    }

    if (!fileData.content.includes(change.search)) {
      results.push({
        file: change.file,
        success: false,
        error: `Search text not found verbatim in ${change.file}. The file may have changed since analysis — re-analyze to refresh.`,
      });
      continue;
    }

    const newContent = fileData.content.replace(change.search, change.replace);
    const commitUrl = await putFile(
      change.file,
      newContent,
      fileData.sha,
      fullCommitMessage,
      token,
      owner,
      repo
    );

    if (commitUrl) {
      results.push({ file: change.file, success: true, commitUrl });
    } else {
      results.push({ file: change.file, success: false, error: "GitHub commit API returned an error" });
    }

    // Small delay between commits to avoid race conditions on the same branch
    if (changes.length > 1) await new Promise((r) => setTimeout(r, 500));
  }

  // Close the issue if all changes succeeded
  if (issueNumber && results.every((r) => r.success)) {
    try {
      await closeGitHubIssue(issueNumber, token, owner, repo);
    } catch {
      /* non-critical */
    }
  }

  return NextResponse.json({
    results,
    allSuccess: results.every((r) => r.success),
    commitUrls: results.filter((r) => r.commitUrl).map((r) => r.commitUrl),
  });
}
