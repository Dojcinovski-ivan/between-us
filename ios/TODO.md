# iOS to-do

## Needs a paid Apple Developer account

- [ ] **Universal Links** so the sign-up confirmation email (and the password
      reset email) opens the app instead of the website. Needs:
      - the Associated Domains capability (`applinks:betweenussupport.com`)
      - `/.well-known/apple-app-site-association` served by the website, listing
        the team ID + `com.betweenussupport.app` and the `/auth/confirm` path
      - the app handling the link: `supabase.auth.verifyOTP(tokenHash:type:)`,
        then straight into onboarding
- [ ] **Push notifications** (mentions, new members, circle formed).
- [ ] App Store Connect listing, TestFlight.

## Before deploying the website changes

- [ ] Run `supabase/migrations/0029_rate_limits.sql`. Until then the rate
      limiter fails open (logs an error, lets every request through).
- [ ] Run `supabase/migrations/0030_user_blocks.sql`. Until then Block in the
      app fails with an error (the table doesn't exist yet).

## App Store guideline 1.2 resubmission (build 2)

- [ ] Run `supabase/migrations/0031_moderation.sql`. Until then the word
      filter and ban checks don't exist, and Ban Member in the admin panel
      fails (no is_banned column).
- [ ] App Store Connect: set the age rating to 18+.
- [ ] Reply to App Review: report and block on every post, posts filtered
      for blocked words, reported posts leave the reporter's feed, reports
      reviewed within 24 hours with Ban Member, contact row in Profile.

## Later

- [ ] Google sign-in. If added, **Sign in with Apple must be added too** (App Store rule 4.8).
- [ ] Invite links in the app (web only for now).
- [ ] Blocking from the website's post menu. Blocks made in the app already
      hide posts on the website, and can be undone on the web profile page.
- [ ] App errors in the admin health view: /api/log-error only accepts the
      website's cookie login, not the app's token.
