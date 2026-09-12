"use client";

import { useState } from "react";
import { ReportsQueue } from "./ReportsQueue";
import { PromptsManager } from "./PromptsManager";
import { StatsOverview } from "./StatsOverview";
import { ResourcesManager } from "./ResourcesManager";
import { AdviceManager } from "./AdviceManager";
import { BlogManager } from "./BlogManager";
import { HealthOverview } from "./HealthOverview";
import { CirclesManager } from "./CirclesManager";
import type { PendingReport, Prompt, Stats, Resource, DailyAdvice, BlogPostSummary } from "./types";
import type { CircleHealth, ErrorLogRow } from "@/lib/circleHealth";
import type { CategoryOption } from "@/lib/categories";

type Tab = "reports" | "health" | "circles" | "prompts" | "advice" | "resources" | "blog" | "stats";

export function AdminPanel({
  initialReports,
  initialPrompts,
  initialResources,
  initialAdvice,
  initialBlogPosts,
  stats,
  health,
  errors,
  categoryOptions,
}: {
  initialReports: PendingReport[];
  initialPrompts: Prompt[];
  initialResources: Resource[];
  initialAdvice: DailyAdvice[];
  initialBlogPosts: BlogPostSummary[];
  stats: Stats;
  health: CircleHealth;
  errors: ErrorLogRow[];
  categoryOptions: CategoryOption[];
}) {
  const [tab, setTab] = useState<Tab>("reports");
  const [pendingCount, setPendingCount] = useState(initialReports.length);

  const tabs: { id: Tab; label: string }[] = [
    { id: "reports", label: `Reports${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { id: "health", label: "Circle Health" },
    { id: "circles", label: "Circles" },
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
      {tab === "health" && <HealthOverview health={health} errors={errors} />}
      {tab === "circles" && <CirclesManager />}
      {tab === "prompts" && (
        <PromptsManager initialPrompts={initialPrompts} categoryOptions={categoryOptions} />
      )}
      {tab === "advice" && (
        <AdviceManager initialAdvice={initialAdvice} categoryOptions={categoryOptions} />
      )}
      {tab === "resources" && (
        <ResourcesManager initialResources={initialResources} categoryOptions={categoryOptions} />
      )}
      {tab === "blog" && <BlogManager initialPosts={initialBlogPosts} />}
      {tab === "stats" && <StatsOverview stats={stats} />}
    </div>
  );
}
