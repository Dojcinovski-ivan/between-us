// Shared between the auth middleware (server) and the cookie consent
// banner (client), so both agree on which pages are inside the logged
// in app versus public.
export const PROTECTED_PATHS = ["/circle", "/profile", "/onboarding", "/admin"];
