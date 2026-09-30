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

## Layout

- `BetweenUs/App` — app entry, `SessionStore` (who is signed in), `RootView`
- `BetweenUs/Core` — config, Supabase client, `/api/mobile` client, models
- `BetweenUs/DesignSystem` — colours from the website with dark variants
- `BetweenUs/Features` — one folder per screen

The project uses folder-synced groups: new files under `BetweenUs/` are picked
up by Xcode automatically.
