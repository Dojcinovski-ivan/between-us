// Reports a chat-reliability failure to /api/log-error. Fire-and-forget:
// logging must never throw into, block, or break the user's flow. Only ever
// pass metadata here — never message content.

type ErrorSource = "post_create" | "realtime" | "client";

export function logClientError(
  source: ErrorSource,
  message: string,
  context?: Record<string, string | number | null | undefined>,
) {
  try {
    void fetch("/api/log-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source, message: String(message).slice(0, 500), context }),
      keepalive: true, // still sends if the tab is closing
    }).catch(() => {});
  } catch {
    /* swallow — a failed log must never surface to the user */
  }
}
