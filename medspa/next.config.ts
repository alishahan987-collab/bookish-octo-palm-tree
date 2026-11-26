import type { NextConfig } from "next";

// Optimised images from the project's Supabase Storage bucket.
const raw = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase = raw ? new URL(raw) : null;

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // This app lives in a sub-folder of the repository; keep tracing scoped to it.
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  reactStrictMode: true,
  env: { NEXT_PUBLIC_MEDIA_HOST: supabase?.host ?? "" },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabase
      ? [{ protocol: supabase.protocol.replace(":", "") as "http" | "https", hostname: supabase.hostname, port: supabase.port, pathname: "/storage/v1/object/public/**" }]
      : [],
    // Local Supabase runs on 127.0.0.1 during development and tests.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production" || supabase?.hostname === "127.0.0.1",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
