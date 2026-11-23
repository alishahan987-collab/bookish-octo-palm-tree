import type { NextConfig } from "next";

// Allow optimised images from the project's Supabase Storage bucket.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  // Lets CI build demo and production variants side by side.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseUrl
      ? [{ protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https", hostname: supabaseUrl.hostname, port: supabaseUrl.port, pathname: "/storage/v1/object/public/**" }]
      : [],
    // Local Supabase runs on 127.0.0.1; Next blocks private IPs by default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production" || supabaseUrl?.hostname === "127.0.0.1",
  },
  reactStrictMode: true,
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      { source: "/:path*", headers: security },
      // The admin and API are never indexed.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
