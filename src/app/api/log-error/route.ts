import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Records a chat-reliability failure (a post that failed to save, a realtime
// channel that errored). Deliberately narrow: only a logged-in user may write,
// only known sources are accepted, and the payload is whitelisted and capped so
// message content can never leak in through here.

const ALLOWED_SOURCES = new Set(["post_create", "realtime", "client"]);
const ALLOWED_CONTEXT_KEYS = new Set(["route", "circle_id", "code", "status", "kind"]);
const MAX_MESSAGE = 500;
const MAX_VALUE = 200;

function sanitizeContext(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!ALLOWED_CONTEXT_KEYS.has(k)) continue; // drop anything not whitelisted
    if (v === null || v === undefined) continue;
    if (typeof v === "object") continue; // no nested objects — could carry content
    out[k] = String(v).slice(0, MAX_VALUE);
  }
  return Object.keys(out).length ? out : null;
}

export async function POST(request: NextRequest) {
  // Must be an authenticated session — keeps this from being an open write sink.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 204 }); // silently ignore

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const { source, message, context } = (body ?? {}) as {
    source?: unknown;
    message?: unknown;
    context?: unknown;
  };

  if (typeof source !== "string" || !ALLOWED_SOURCES.has(source)) {
    return new NextResponse(null, { status: 204 });
  }

  const admin = createAdminClient();
  await admin.from("error_logs").insert({
    source,
    message: (typeof message === "string" ? message : "unknown error").slice(0, MAX_MESSAGE),
    context: sanitizeContext(context),
    user_id: user.id,
  });

  return new NextResponse(null, { status: 204 });
}
