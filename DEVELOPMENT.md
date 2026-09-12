# Development

This project has a separate development environment so you can test changes
without touching real user data.

## Running locally

### Against the dev database (default for local work)

```
npm run dev:staging
```

This loads `.env.local.dev`, which points at the `between-us-dev` Supabase
project. Safe to use freely — create accounts, post, delete circles, run
any flow you want. Nothing here touches production.

### Against the production database (emergencies only)

```
npm run dev:local
```

This loads `.env.local`, which points at the live `between-us` Supabase
project — the same database real users are on. Only run this when you
specifically need to debug something that only reproduces against
production data. Never use it for routine feature testing.

## Creating test accounts

- For everyday testing, sign up normally while running `npm run dev:staging`.
  Accounts created there live in the dev database only.
- If you need to test the production experience itself (e.g. verifying an
  email actually sends, checking a production-only integration), use the
  permanent test account instead of creating a new production user:
  - Email: `hello@betweenussupport.com`
  - Username: `between_us_team`
  - `is_admin: true`
  - This account is never deleted. It exists only for testing the
    production experience and is not a member of any circle.

## Rules

- **Never run destructive SQL directly against the production database.**
  If a migration or one-off fix is genuinely needed in production, write
  the exact SQL, show it before running it, and get explicit confirmation
  first.
- Treat `.env.local` (production credentials) and `.env.local.dev`
  (development credentials) as different trust levels. `.env.local` is
  marked `PRODUCTION — do not use for testing` at the top of the file for
  a reason.
- Both env files are gitignored and must never be committed.

## Environments at a glance

| Context | Command | Database |
|---|---|---|
| Local dev (default) | `npm run dev:staging` | `between-us-dev` |
| Local dev (emergencies) | `npm run dev:local` | production |
| Vercel `main` branch | — | production |
| Vercel preview deployments (any other branch) | — | `between-us-dev` |
