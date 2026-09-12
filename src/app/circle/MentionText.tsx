import { Fragment } from "react";
import { splitMentionSegments } from "@/lib/mentions";

// Renders post content with @ mentions picked out. Everything else is
// passed through untouched, including the whitespace handling the
// surrounding paragraph already applies.
//
// Mentions are styled text, not links: tapping one does nothing on
// purpose, so nothing here is focusable or interactive.
//
// Your own posts sit on a terracotta bubble, and terracotta is the mention
// colour, so a mention inside one would be invisible against its own
// background. On your own posts it keeps the bubble's text colour and
// leans on weight alone.
export function MentionText({ content, isOwnPost }: { content: string; isOwnPost: boolean }) {
  const segments = splitMentionSegments(content);

  return (
    <>
      {segments.map((segment, i) =>
        segment.isMention ? (
          <span key={i} className={isOwnPost ? "font-semibold" : "font-semibold text-accent"}>
            {segment.text}
          </span>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
