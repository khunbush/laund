import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
