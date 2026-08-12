"use client";

import { useState } from "react";
import { ReportsQueue } from "./ReportsQueue";
import { PromptsManager } from "./PromptsManager";
import { StatsOverview } from "./StatsOverview";
import { ResourcesManager } from "./ResourcesManager";
import { AdviceManager } from "./AdviceManager";
import { BlogManager } from "./BlogManager";
import type { PendingReport, Prompt, Stats, Resource, DailyAdvice, BlogPostSummary } from "./types";

type Tab = "reports" | "prompts" | "advice" | "resources" | "blog" | "stats";

export function AdminPanel({
  initialReports,
  initialPrompts,
  initialResources,
  initialAdvice,
  initialBlogPosts,
  stats,
}: {
  initialReports: PendingReport[];
  initialPrompts: Prompt[];
  initialResources: Resource[];
  initialAdvice: DailyAdvice[];
  initialBlogPosts: BlogPostSummary[];
  stats: Stats;
}) {
  const [tab, setTab] = useState<Tab>("reports");
  const [pendingCount, setPendingCount] = useState(initialReports.length);

  const tabs: { id: Tab; label: string }[] = [
    { id: "reports", label: `Reports${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { id: "prompts", label: "Weekly Prompts" },
    { id: "advice", label: "Daily Advice" },
    { id: "resources", label: "Resources" },
    { id: "blog", label: "Blog" },
    { id: "stats", label: "Overview" },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-sage text-ink"
                : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reports" && (
        <ReportsQueue initialReports={initialReports} onCountChange={setPendingCount} />
      )}
      {tab === "prompts" && <PromptsManager initialPrompts={initialPrompts} />}
      {tab === "advice" && <AdviceManager initialAdvice={initialAdvice} />}
      {tab === "resources" && <ResourcesManager initialResources={initialResources} />}
      {tab === "blog" && <BlogManager initialPosts={initialBlogPosts} />}
      {tab === "stats" && <StatsOverview stats={stats} />}
    </div>
  );
}
