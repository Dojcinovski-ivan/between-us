"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { setTopicStatus, triggerGeneration } from "./blogQueueActions";
import type { BlogTopic, BlogTopicStatus } from "./types";

const STATUS_STYLES: Record<BlogTopicStatus, string> = {
  pending: "bg-surface2 text-muted",
  generating: "bg-accent-soft text-accent",
  drafted: "bg-accent-soft text-accent",
  published: "bg-sage-soft text-sage",
  failed: "bg-warn/10 text-warn",
  skipped: "bg-surface2 text-muted line-through",
};

function StatusBadge({ status }: { status: BlogTopicStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[status]}`}>{status}</span>
  );
}

function TopicRow({
  topic,
  isNext,
  onStatusChange,
}: {
  topic: BlogTopic;
  isNext: boolean;
  onStatusChange: (id: string, status: "pending" | "skipped") => Promise<void>;
}) {
  const [isWorking, setIsWorking] = useState(false);

  return (
    <div className={`p-4 ${isNext ? "bg-accent-soft/30" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{topic.topic}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <StatusBadge status={topic.status} />
            {isNext && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-accent-text">
                Generating next
              </span>
            )}
            <span className="rounded-full bg-sage-soft px-2 py-0.5 text-sage">{topic.category}</span>
            <span className="truncate">{topic.target_keyword}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {topic.blog_post_id && (
            <Link
              href={`/admin/blog/${topic.blog_post_id}/edit`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface2 hover:text-ink"
            >
              Edit post
            </Link>
          )}
          {(topic.status === "pending" || topic.status === "skipped") && (
            <button
              type="button"
              disabled={isWorking}
              onClick={async () => {
                setIsWorking(true);
                await onStatusChange(topic.id, topic.status === "skipped" ? "pending" : "skipped");
                setIsWorking(false);
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface2 hover:text-ink disabled:opacity-50"
            >
              {topic.status === "skipped" ? "Unskip" : "Skip"}
            </button>
          )}
        </div>
      </div>

      {topic.failure_reason && (
        <p className="mt-2 rounded-lg border border-border bg-surface2 p-3 text-xs leading-relaxed text-muted">
          {topic.failure_reason}
        </p>
      )}
    </div>
  );
}

export function QueueManager({ initialTopics }: { initialTopics: BlogTopic[] }) {
  const [topics, setTopics] = useState(initialTopics);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pending = topics.filter((t) => t.status === "pending");

  // The next two pending topics are the ones claim_next_blog_topics() will
  // hand out on the next run, so they are ordered the same way it orders.
  const nextUp = new Set(pending.slice(0, 2).map((t) => t.id));

  async function onStatusChange(id: string, status: "pending" | "skipped") {
    const result = await setTopicStatus(id, status);
    if (!result.ok) {
      setMessage(result.error ?? "Could not update that topic.");
      return;
    }
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, failure_reason: status === "pending" ? null : "Skipped by an admin" }
          : t,
      ),
    );
  }

  function onGenerate() {
    setMessage(null);
    startTransition(async () => {
      const result = await triggerGeneration();
      setMessage(result.ok ? (result.summary ?? "Done.") : (result.error ?? "The run failed."));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted">Topic queue</h2>
          <p className="mt-1 text-xs text-muted">
            {pending.length} pending
            {pending.length < 10 && ", the next run will top the queue up automatically"}
          </p>
        </div>
        <Button onClick={onGenerate} disabled={isPending} className="px-4 py-2 text-sm">
          {isPending ? "Generating, this takes a few minutes" : "Generate now"}
        </Button>
      </div>

      {message && (
        <p className="rounded-xl border border-border bg-surface2 p-3 text-sm text-ink">{message}</p>
      )}

      {topics.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          The queue is empty.
        </p>
      ) : (
        <Card className="divide-y divide-border p-0">
          {topics.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              isNext={nextUp.has(topic.id)}
              onStatusChange={onStatusChange}
            />
          ))}
        </Card>
      )}
    </div>
  );
}
