import { NextRequest, NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

// GET: Fetch pull requests and review comments
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const repo = searchParams.get("repo") || process.env.GITHUB_REPO || "";
  const token = searchParams.get("token") || process.env.GITHUB_TOKEN || "";

  if (!repo || !token) {
    return NextResponse.json(
      { error: "Missing repo or token" },
      { status: 400 }
    );
  }

  const headers = getHeaders(token);

  try {
    if (action === "pulls") {
      const state = searchParams.get("state") || "open";
      const res = await fetch(
        `${GITHUB_API}/repos/${repo}/pulls?state=${state}&per_page=30&sort=updated&direction=desc`,
        { headers }
      );
      const pulls = await res.json();

      // Fetch review comments for each PR
      const pullsWithReviews = await Promise.all(
        pulls.map(async (pr: any) => {
          const commentsRes = await fetch(
            `${GITHUB_API}/repos/${repo}/issues/${pr.number}/comments`,
            { headers }
          );
          const comments = await commentsRes.json();
          const claudeComments = Array.isArray(comments)
            ? comments.filter(
                (c: any) =>
                  c.user?.login?.includes("claude") ||
                  c.user?.login?.includes("github-actions") ||
                  c.body?.includes("Code Review") ||
                  c.body?.includes("Critical") ||
                  c.body?.includes("Warning")
              )
            : [];

          return {
            number: pr.number,
            title: pr.title,
            state: pr.state,
            merged: pr.merged_at !== null,
            author: pr.user?.login,
            branch: pr.head?.ref,
            baseBranch: pr.base?.ref,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            additions: pr.additions,
            deletions: pr.deletions,
            changedFiles: pr.changed_files,
            url: pr.html_url,
            reviewComments: claudeComments.map((c: any) => ({
              id: c.id,
              body: c.body,
              author: c.user?.login,
              createdAt: c.created_at,
            })),
            reviewStatus: claudeComments.length > 0
              ? claudeComments.some((c: any) => c.body?.includes("Critical") || c.body?.includes("\u{1F534}"))
                ? "issues_found"
                : "passed"
              : "pending",
          };
        })
      );

      return NextResponse.json(pullsWithReviews);
    }

    if (action === "stats") {
      const [openRes, closedRes] = await Promise.all([
        fetch(`${GITHUB_API}/repos/${repo}/pulls?state=open&per_page=100`, { headers }),
        fetch(`${GITHUB_API}/repos/${repo}/pulls?state=closed&per_page=100`, { headers }),
      ]);
      const openPulls = await openRes.json();
      const closedPulls = await closedRes.json();
      const open = Array.isArray(openPulls) ? openPulls.length : 0;
      const closed = Array.isArray(closedPulls) ? closedPulls.length : 0;

      return NextResponse.json({
        totalPRs: open + closed,
        openPRs: open,
        mergedPRs: Array.isArray(closedPulls) ? closedPulls.filter((p: any) => p.merged_at).length : 0,
        closedPRs: closed,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "GitHub API error" },
      { status: 500 }
    );
  }
}

// POST: Trigger Claude review by commenting on PR
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { repo, token, prNumber, command } = body;

  if (!repo || !token || !prNumber) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const headers = getHeaders(token);
  const message = command || "@claude review this PR";

  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${repo}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ body: message }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to post comment");
    }

    const comment = await res.json();
    return NextResponse.json({
      success: true,
      commentId: comment.id,
      message: "Claude review triggered successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to trigger review" },
      { status: 500 }
    );
  }
}
