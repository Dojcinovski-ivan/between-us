import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobileAuth";
import { completeOnboardingFor } from "@/lib/onboarding";
import { FELT_EXPERIENCES } from "@/lib/feltExperience";
import { WHO_WAS_IT } from "@/lib/whoWasIt";
import { MECHANISMS } from "@/lib/mechanisms";
import { JOURNEY_STAGES } from "@/lib/journeyStages";
import { AGE_RANGES } from "@/lib/ageRanges";
import { GENDERS } from "@/lib/genders";
import { COUNTRIES } from "@/lib/countries";
import { ADJECTIVES, NOUNS } from "@/lib/anonymousNames";

// The question options, served from the same lists the website's wizard
// and the server-side validation use, so the app never carries its own
// copy that could drift out of step.
export async function GET(request: NextRequest) {
  if (!(await getMobileUser(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    feltExperiences: FELT_EXPERIENCES,
    whoWasIt: WHO_WAS_IT,
    mechanisms: MECHANISMS,
    journeyStages: JOURNEY_STAGES,
    ageRanges: AGE_RANGES,
    genders: GENDERS,
    countries: COUNTRIES,
    nameParts: { adjectives: ADJECTIVES, nouns: NOUNS },
  });
}

// Creates the profile and places the member in a circle.
export async function POST(request: NextRequest) {
  const user = await getMobileUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const result = await completeOnboardingFor(user, {
    username: String(body.username ?? ""),
    feltExperience: String(body.feltExperience ?? ""),
    whoWasIt: String(body.whoWasIt ?? ""),
    mechanisms: Array.isArray(body.mechanisms) ? body.mechanisms.map(String) : [],
    journeyStage: String(body.journeyStage ?? ""),
    ageRange: String(body.ageRange ?? ""),
    gender: String(body.gender ?? ""),
    country: String(body.country ?? ""),
    sensitiveConsent: body.sensitiveConsent === true,
  });

  // A validation message is a normal answer the app shows as-is, so it
  // comes back 200 with the message; "already onboarded" tells the app to
  // just reload the profile.
  return NextResponse.json(result);
}
