import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  experimental: {
    // Keep dynamic pages (history/dashboard) in the client router cache so
    // tab switches are instant. Mutations still show fresh data immediately
    // because every server action calls revalidatePath, which purges this.
    staleTimes: {
      dynamic: 120,
      static: 300,
    },
  },
};

export default nextConfig;
