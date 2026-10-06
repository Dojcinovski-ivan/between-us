import { NextResponse } from "next/server";

// Universal Links: tells iOS which links on this domain the Between Us app
// may open instead of Safari. Apple fetches this from www only, and never
// follows a redirect to get it, so it cannot live on the bare domain.
//
// A route rather than a file in public/ because the name has no extension
// and Apple wants it served as JSON.
const association = {
  applinks: {
    details: [
      {
        // Apple team ID, then the app's bundle ID.
        appIDs: ["2B768D77NQ.com.betweenussupport.app"],
        components: [
          // An invited sign-up finishes on the website: the app has no
          // invite flow yet.
          { "/": "/auth/confirm", "?": { invite: "?*" }, exclude: true },
          // The confirmation link in the sign-up email. The app verifies
          // the token itself, see SessionStore.open.
          { "/": "/auth/confirm", "?": { type: "signup" } },
          // "Open your circle" in the notification emails.
          { "/": "/circle" },
          { "/": "/circle/*" },
        ],
      },
    ],
  },
};

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(association);
}
