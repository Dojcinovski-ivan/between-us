import { NextRequest, NextResponse } from "next/server";
import { runBlogGeneration } from "@/lib/blogPipeline";

// Writes and publishes two posts, twice a day. Same CRON_SECRET guard as
// the other two cron routes: Vercel sends it as a bearer token on every
// scheduled invocation, and nothing else can reach this.

// Writing two posts takes a few minutes, which is far past the default
// function timeout. 300 is the Pro ceiling; on Hobby this is ignored and
// the run is cut off at 60s instead, which is why runBlogGeneration takes
// a deadline and stops cleanly rather than being killed mid post.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Stop with time to spare so the final database writes always land.
const SAFETY_MARGIN_MS = 20_000;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBlogGeneration({
      deadlineAt: Date.now() + maxDuration * 1000 - SAFETY_MARGIN_MS,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // A thrown run is worth a 500 so it shows up in Vercel's logs rather
    // than looking like a quiet success.
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
