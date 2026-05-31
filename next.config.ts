import type { NextConfig } from "next";

// Capacitor mobile builds need a fully static export (`output: 'export'`),
// but that mode strips out API routes (/api/chat, /api/search) — which the
// Vercel deployment must serve. So only enable static export for the mobile
// build (signalled by BUILD_TARGET=mobile, set in the build:mobile scripts);
// on Vercel BUILD_TARGET is unset, so it builds as a normal server app and the
// API routes work.
const isMobile = process.env.BUILD_TARGET === 'mobile';

const nextConfig: NextConfig = {
  ...(isMobile ? { output: 'export' as const } : {}),
  images: { unoptimized: true },
};

export default nextConfig;
