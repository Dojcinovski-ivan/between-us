import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobileAuth";
import { recordMentionsFor } from "@/lib/recordMentions";

// Called by the app right after it creates a post. Best effort, like the
// web action: the post is already saved whatever happens here.
export async function POST(request: NextRequest) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let postId = "";
  try {
    const body = await request.json();
    if (typeof body?.postId === "string") postId = body.postId;
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  await recordMentionsFor(user.id, postId);
  return NextResponse.json({ ok: true });
}
