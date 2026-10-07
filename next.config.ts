import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Not in Next's default list: resolve `@hugeicons/core-free-icons` barrel imports to the
    // individual icon modules, so dev compiles and bundles only load the icons we use.
    optimizePackageImports: ["@hugeicons/core-free-icons"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
