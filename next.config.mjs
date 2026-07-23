/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Without this, the App Router's client-side Router Cache can
    // serve a stale RSC render of a dynamic page (e.g. /circle) for
    // up to 30s after navigating away and back, showing pre-post
    // state even though the server-side data is already current.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
