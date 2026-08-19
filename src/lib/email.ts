import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameWeek } from "@/lib/time";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { CircleFormedEmail } from "@/emails/CircleFormedEmail";
import { NewMemberEmail } from "@/emails/NewMemberEmail";
import { WeeklyDigestEmail } from "@/emails/WeeklyDigestEmail";
import { ReengagementEmail } from "@/emails/ReengagementEmail";
import { ReportNotificationEmail } from "@/emails/ReportNotificationEmail";
import { ResetPasswordEmail } from "@/emails/ResetPasswordEmail";
import { ConfirmSignupEmail } from "@/emails/ConfirmSignupEmail";
import { circleName } from "@/lib/categories";
import { signUnsubscribeToken } from "@/lib/unsubscribeToken";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Between Us <hello@betweenussupport.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://betweenussupport.com";
const CIRCLE_URL = `${SITE_URL}/circle`;
const ADMIN_URL = `${SITE_URL}/admin`;
const RESET_URL = `${SITE_URL}/reset-password`;
const CONFIRM_URL = `${SITE_URL}/auth/confirm`;

function unsubscribeUrl(userId: string) {
  const token = signUnsubscribeToken(userId);
  return `${SITE_URL}/unsubscribe?u=${userId}&t=${token}`;
}

// Every send function swallows its own errors rather than throwing, since
// a failed email should never block the onboarding flow, a cron run, or
// any other caller. Resend also fails closed (no crash) if the API key
// is missing, which matters for local dev without RESEND_API_KEY set.
async function getUserEmail(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

export async function sendWelcomeEmail(userId: string) {
  try {
    const admin = createAdminClient();
    const email = await getUserEmail(admin, userId);
    if (!email) return;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "You found your circle",
      react: WelcomeEmail({ circleUrl: CIRCLE_URL }),
    });
  } catch {
    // Best effort. Onboarding itself must never fail because of this.
  }
}

// Unlike everything else here this is not best effort — if it fails the
// person is locked out — so it reports back whether the mail went out.
// The caller still shows the same message either way, so the return value
// only ever decides whether to offer a retry, never what the page says.
export async function sendPasswordResetEmail(email: string) {
  try {
    const admin = createAdminClient();

    // generateLink mints the recovery token without Supabase sending
    // anything itself, so the only email that goes out is ours: our
    // sender, our template, and a link on our own domain instead of the
    // project's supabase.co URL.
    // No redirectTo: the link Supabase builds is thrown away, only the
    // token is used. Passing one would just add a way for this to fail
    // whenever the URL isn't in the project's redirect allow list.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    const tokenHash = data?.properties?.hashed_token;

    // No account for this address, or Supabase's own rate limit kicked
    // in. Neither is something the caller may reveal, so both look like
    // an ordinary send from the outside.
    if (error || !tokenHash) return true;

    // /reset-password exchanges this for a session client side.
    const resetUrl = `${RESET_URL}?token_hash=${encodeURIComponent(tokenHash)}`;

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Reset your Between Us password",
      react: ResetPasswordEmail({ resetUrl }),
    });

    if (sendError) {
      console.error("[password-reset] resend failed:", sendError);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[password-reset] send failed:", err);
    return false;
  }
}

export type SignupResult = "sent" | "exists" | "failed";

/**
 * Creates the account and sends our own confirmation email.
 *
 * Same trick as the password reset: generateLink mints the confirmation
 * token without Supabase mailing anything, so the only email that goes
 * out is ours. The account exists but stays unconfirmed until the link
 * is clicked — /auth/confirm exchanges the token for a session.
 *
 * Requires "Confirm email" to be ON in Supabase auth settings. With
 * autoconfirm still enabled the account would be usable before the link
 * is ever clicked, which defeats the point.
 */
export async function sendSignupConfirmationEmail({
  email,
  password,
  marketingConsent,
  inviteToken,
}: {
  email: string;
  password: string;
  marketingConsent: boolean;
  inviteToken?: string;
}): Promise<SignupResult> {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      // Read back off user_metadata when the profile row is created in
      // onboarding — see completeOnboarding.
      options: { data: { email_marketing_consent: marketingConsent } },
    });

    if (error) {
      // Unlike a password reset, registration has to say this out loud:
      // someone typing an address they already signed up with needs to be
      // sent to the login page, not left waiting for an email.
      const code = (error as { code?: string }).code;
      if (code === "email_exists" || /already (been )?registered/i.test(error.message)) {
        return "exists";
      }
      console.error("[signup] generateLink failed:", error);
      return "failed";
    }

    const tokenHash = data?.properties?.hashed_token;
    if (!tokenHash) {
      console.error("[signup] generateLink returned no token");
      return "failed";
    }

    // The invite token rides along so an invite still works when the
    // confirmation link is opened somewhere the cookie isn't — a phone
    // mail app when the link was clicked on a laptop, say.
    const params = new URLSearchParams({ token_hash: tokenHash, type: "signup" });
    if (inviteToken) params.set("invite", inviteToken);

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Confirm your email — Between Us",
      react: ConfirmSignupEmail({ confirmUrl: `${CONFIRM_URL}?${params.toString()}` }),
    });

    if (sendError) {
      console.error("[signup] resend failed:", sendError);
      return "failed";
    }

    return "sent";
  } catch (err) {
    console.error("[signup] send failed:", err);
    return "failed";
  }
}

export async function sendCircleFormedEmail(firstMemberId: string) {
  try {
    const admin = createAdminClient();
    const email = await getUserEmail(admin, firstMemberId);
    if (!email) return;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your circle just formed.",
      react: CircleFormedEmail({ circleUrl: CIRCLE_URL }),
    });
  } catch {
    // Best effort.
  }
}

export async function sendNewMemberEmail(circleId: string, newMemberId: string) {
  try {
    const admin = createAdminClient();
    const { data: members } = await admin
      .from("users")
      .select("id")
      .eq("circle_id", circleId)
      .neq("id", newMemberId);

    await Promise.allSettled(
      (members ?? []).map(async (member) => {
        const email = await getUserEmail(admin, member.id);
        if (!email) return;
        await resend.emails.send({
          from: FROM,
          to: email,
          subject: "Someone new joined your circle.",
          react: NewMemberEmail({ circleUrl: CIRCLE_URL }),
        });
      }),
    );
  } catch {
    // Best effort.
  }
}

type ReportNotificationRow = {
  reason: string;
  post: { content: string; circles: { category: string } | null; users: { username: string } | null } | null;
  reporter: { username: string } | null;
};

export async function sendReportNotification(reportId: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("reports")
      .select("reason, post:posts(content, circles(category), users(username)), reporter:users(username)")
      .eq("id", reportId)
      .single();

    const report = data as unknown as ReportNotificationRow | null;
    if (!report || !report.post) return;

    await resend.emails.send({
      from: FROM,
      to: "hello@betweenussupport.com",
      subject: "New report in Between Us",
      react: ReportNotificationEmail({
        postContent: report.post.content,
        reason: report.reason,
        reportedByUsername: report.reporter?.username ?? "someone",
        postAuthorUsername: report.post.users?.username ?? "someone",
        circleName: circleName(report.post.circles?.category ?? ""),
        adminUrl: ADMIN_URL,
      }),
    });
  } catch {
    // Best effort. Report submission itself must never fail because of this.
  }
}

export async function sendWeeklyDigest() {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const { data: recipients } = await admin
    .from("users")
    .select("id, category, circle_id")
    .eq("email_marketing_consent", true)
    .not("circle_id", "is", null);

  await Promise.allSettled(
    (recipients ?? []).map(async (recipient) => {
      try {
        const email = await getUserEmail(admin, recipient.id);
        if (!email) return;

        const [{ data: prompt }, { data: posts }] = await Promise.all([
          admin
            .from("prompts")
            .select("content, week_start")
            .eq("category", recipient.category)
            .lte("week_start", today)
            .order("week_start", { ascending: false })
            .limit(1)
            .maybeSingle(),
          admin
            .from("posts")
            .select("user_id, created_at")
            .eq("circle_id", recipient.circle_id)
            .eq("is_removed", false),
        ]);

        const postersThisWeek = new Set(
          (posts ?? [])
            .filter((p) => isSameWeek(new Date(p.created_at), now))
            .map((p) => p.user_id),
        );

        await resend.emails.send({
          from: FROM,
          to: email,
          subject: "This week in your circle",
          react: WeeklyDigestEmail({
            circleUrl: CIRCLE_URL,
            unsubscribeUrl: unsubscribeUrl(recipient.id),
            promptContent: prompt?.content ?? null,
            posterCount: postersThisWeek.size,
          }),
        });
      } catch {
        // Best effort per recipient, one failure should not stop the rest.
      }
    }),
  );
}

export async function sendReengagementEmail(userId: string) {
  try {
    const admin = createAdminClient();
    const email = await getUserEmail(admin, userId);
    if (!email) return;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your circle is thinking of you",
      react: ReengagementEmail({
        circleUrl: CIRCLE_URL,
        unsubscribeUrl: unsubscribeUrl(userId),
      }),
    });

    // Marks when this went out so the cron job does not send it again
    // every single day someone stays inactive, at most once a week.
    await admin
      .from("users")
      .update({ last_reengagement_email_at: new Date().toISOString() })
      .eq("id", userId);
  } catch {
    // Best effort.
  }
}
