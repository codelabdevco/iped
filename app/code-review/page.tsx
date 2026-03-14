"use client";

import { useState, useEffect, useCallback } from "react";

interface PR {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  author: string;
  branch: string;
  baseBranch: string;
  createdAt: string;
  updatedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  url: string;
  reviewStatus: "pending" | "issues_found" | "passed";
  reviewComments: ReviewComment[];
}

interface ReviewComment {
  id: number;
  body: string;
  author: string;
  createdAt: string;
}

interface Settings {
  repo: string;
  token: string;
  language: "th" | "en";
}

export default function CodeReviewDashboard() {
  const [settings, setSettings] = useState<Settings>({ repo: "", token: "", language: "th" });
  const [pulls, setPulls] = useState<PR[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [selectedPR, setSelectedPR] = useState<PR | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cr-settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      setSettingsSaved(true);
    } else {
      setShowSettings(true);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem("cr-settings", JSON.stringify(settings));
    setSettingsSaved(true);
    setShowSettings(false);
    setSuccessMsg("Settings saved!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const fetchPulls = useCallback(async () => {
    if (!settings.repo || !settings.token) return;
    setLoading(true);
    setError("");
    try {
      const state = filter === "all" ? "all" : filter;
      const res = await fetch(
        \`/api/code-review?action=pulls&repo=\${settings.repo}&token=\${settings.token}&state=\${state}\`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPulls(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [settings, filter]);

  useEffect(() => {
    if (settingsSaved) fetchPulls();
  }, [fetchPulls, settingsSaved]);

  const triggerReview = async (prNumber: number) => {
    setTriggerLoading(prNumber);
    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: settings.repo,
          token: settings.token,
          prNumber,
          command: "@claude review this PR thoroughly. Focus on bugs, security, and TypeScript best practices. Comment in Thai.",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccessMsg(\`Triggered Claude review on PR #\${prNumber}\`);
      setTimeout(() => { setSuccessMsg(""); fetchPulls(); }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTriggerLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issues_found": return { bg: "bg-red-500/20 text-red-400 border-red-500/30", label: "Found Issues", icon: "!" };
      case "passed": return { bg: "bg-green-500/20 text-green-400 border-green-500/30", label: "Passed", icon: "\u2713" };
      default: return { bg: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Pending", icon: "\u25CF" };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return \`\${mins} min ago\`;
    if (hours < 24) return \`\${hours}h ago\`;
    return \`\${days}d ago\`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="text-lg">\u2713</span> {successMsg}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-xl font-bold">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold">Code Review Dashboard</h1>
              <p className="text-sm text-gray-400">Claude AI-Powered Review</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {settings.repo && (
              <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg">
                {settings.repo}
              </span>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              \u2699\uFE0F
            </button>
            <button
              onClick={fetchPulls}
              disabled={loading}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span className="animate-spin">\u21BB</span>
              ) : (
                <span>\u21BB</span>
              )}
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              \u2699\uFE0F Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">GitHub Repository</label>
                <input
                  type="text"
                  placeholder="owner/repo (e.g. codelabdevco/iped)"
                  value={settings.repo}
                  onChange={(e) => setSettings({ ...settings, repo: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">GitHub Personal Access Token</label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={settings.token}
                  onChange={(e) => setSettings({ ...settings, token: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Token needs: repo, write:discussion scopes. Stored in browser only.
              </p>
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl font-medium transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="hover:text-red-300">\u2715</button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(["all", "open", "closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={\`px-4 py-2 rounded-xl text-sm font-medium transition-colors \${
                filter === f
                  ? "bg-orange-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }\`}
            >
              {f === "all" ? "All PRs" : f === "open" ? "\u{1F7E2} Open" : "\u{1F7E3} Closed/Merged"}
            </button>
          ))}
          <div className="ml-auto text-sm text-gray-500">
            {pulls.length} pull request{pulls.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PR List */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-4 animate-spin">\u21BB</div>
                <p>Loading pull requests...</p>
              </div>
            ) : pulls.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-4">\u{1F4ED}</div>
                <p>{settingsSaved ? "No pull requests found" : "Configure settings to get started"}</p>
              </div>
            ) : (
              pulls.map((pr) => {
                const badge = getStatusBadge(pr.reviewStatus);
                return (
                  <div
                    key={pr.number}
                    onClick={() => setSelectedPR(pr)}
                    className={\`bg-gray-900 border rounded-2xl p-5 cursor-pointer transition-all hover:border-gray-600 \${
                      selectedPR?.number === pr.number
                        ? "border-orange-500 ring-1 ring-orange-500/20"
                        : "border-gray-800"
                    }\`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={\`w-2.5 h-2.5 rounded-full \${pr.merged ? "bg-purple-500" : pr.state === "open" ? "bg-green-500" : "bg-red-500"}\`} />
                          <span className="text-sm text-gray-400">#{pr.number}</span>
                          <span className={\`text-xs px-2 py-0.5 rounded-full border \${badge.bg}\`}>
                            {badge.icon} {badge.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white truncate">{pr.title}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{pr.author}</span>
                          <span>{pr.branch} \u2192 {pr.baseBranch}</span>
                          <span className="text-green-400">+{pr.additions}</span>
                          <span className="text-red-400">-{pr.deletions}</span>
                          <span>{pr.changedFiles} files</span>
                          <span>{formatDate(pr.updatedAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerReview(pr.number); }}
                        disabled={triggerLoading === pr.number}
                        className="shrink-0 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {triggerLoading === pr.number ? "Sending..." : "@claude Review"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PR Detail / Review Panel */}
          <div className="space-y-4">
            {selectedPR ? (
              <>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-bold text-lg mb-1">PR #{selectedPR.number}</h3>
                  <p className="text-gray-300 text-sm mb-4">{selectedPR.title}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Author</span>
                      <span>{selectedPR.author}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Branch</span>
                      <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{selectedPR.branch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Changes</span>
                      <span>
                        <span className="text-green-400">+{selectedPR.additions}</span>{" / "}
                        <span className="text-red-400">-{selectedPR.deletions}</span>{" "}
                        ({selectedPR.changedFiles} files)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={\`text-xs px-2 py-0.5 rounded-full border \${getStatusBadge(selectedPR.reviewStatus).bg}\`}>
                        {getStatusBadge(selectedPR.reviewStatus).label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <a
                      href={selectedPR.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors"
                    >
                      Open in GitHub
                    </a>
                    <button
                      onClick={() => triggerReview(selectedPR.number)}
                      disabled={triggerLoading === selectedPR.number}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {triggerLoading === selectedPR.number ? "Sending..." : "@claude Review"}
                    </button>
                  </div>
                </div>

                {/* Review Comments */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h4 className="font-bold mb-3">Review Comments ({selectedPR.reviewComments.length})</h4>
                  {selectedPR.reviewComments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No review comments yet. Click "@claude Review" to start.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedPR.reviewComments.map((comment) => (
                        <div key={comment.id} className="bg-gray-800 rounded-xl p-3 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-purple-400">{comment.author}</span>
                            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                          </div>
                          <div className="text-gray-300 whitespace-pre-wrap text-xs leading-relaxed">
                            {comment.body.length > 500 ? comment.body.slice(0, 500) + "..." : comment.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">\u{1F50D}</div>
                <p className="font-medium">Select a PR</p>
                <p className="text-sm mt-1">Click on a pull request to see details and review comments</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h4 className="font-bold mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => { if (selectedPR) triggerReview(selectedPR.number); }}
                  disabled={!selectedPR}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors disabled:opacity-40"
                >
                  \u{1F916} Trigger Full Review
                </button>
                <a
                  href={selectedPR?.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={\`block w-full text-left px-4 py-3 bg-gray-800 rounded-xl text-sm transition-colors \${selectedPR ? "hover:bg-gray-700" : "opacity-40 pointer-events-none"}\`}
                >
                  \u{1F517} Open PR in GitHub
                </a>
                <button
                  onClick={fetchPulls}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors"
                >
                  \u{1F504} Refresh All PRs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
