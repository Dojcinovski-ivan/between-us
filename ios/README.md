# Between Us for iOS

Native SwiftUI app on the same Supabase project as the website. iOS 17+, iPhone.

## First-time setup

1. Copy `Config/Secrets.example.xcconfig` to `Config/Secrets.xcconfig` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the website's
   `.env.local`. Anon key only — never the service role key. Git ignores this file.
2. Open `BetweenUs.xcodeproj` in Xcode. Swift packages resolve on first open.

## Running in the simulator

Debug builds call the website's `/api/mobile/*` routes on `http://localhost:3000`,
so start the website first from the repo root:

```bash
npm run dev
```

Then in Xcode pick an iPhone simulator in the toolbar and press ⌘R.

No Apple Developer account is needed for the simulator. Push notifications
wait until there is one.

Release builds point at `https://betweenussupport.com` instead; set
`API_BASE_URL` in `Secrets.xcconfig` to override either.

## UI tests

⌘U in Xcode, or from `ios/`:

```bash
xcodebuild test -project BetweenUs.xcodeproj -scheme BetweenUs \
  -destination 'platform=iOS Simulator,name=iPhone 18 Pro' -parallel-testing-enabled NO
```

`SignedOutFlowTests` needs nothing. `SignedInFlowTests` logs in as a real
account and is skipped unless the test runner has `TEST_EMAIL` and
`TEST_PASSWORD`:

- **Terminal:** `./run-ui-tests.sh` reads them from `ios/.test-credentials`
  (git-ignored) and passes them on as `TEST_RUNNER_TEST_EMAIL` and
  `TEST_RUNNER_TEST_PASSWORD`; xcodebuild strips the `TEST_RUNNER_` prefix
  and hands the rest to the tests.
- **Xcode:** Product → Scheme → Edit Scheme → Test → Arguments → Environment
  Variables, add `TEST_EMAIL` and `TEST_PASSWORD`. Leave the scheme unshared
  so they stay in `xcuserdata`, which git ignores.

The account must have finished onboarding and be in a circle with at least
one other member (alone, it gets the waiting room and there is no feed). The
tests post, reply, react, edit and delete for real in that circle, on
whichever Supabase project `Secrets.xcconfig` points at, so keep real members
out of it: use a circle that holds only test accounts.

`create-test-accounts.py` set that up once: two accounts in a circle whose
category is `ui_test_only`. Members are matched to circles by category and
onboarding never produces that one, so no real member can be placed there.
It also wrote `.test-credentials`.

## Layout

- `BetweenUs/App` — app entry, `SessionStore` (who is signed in), `RootView`
- `BetweenUs/Core` — config, Supabase client, `/api/mobile` client, models
- `BetweenUs/DesignSystem` — colours from the website with dark variants
- `BetweenUs/Features` — one folder per screen

The project uses folder-synced groups: new files under `BetweenUs/` are picked
up by Xcode automatically.
