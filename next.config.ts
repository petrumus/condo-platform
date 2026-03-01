import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage for project avatars, logos, and attachments
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        // Supabase Storage public bucket files
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/render/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
