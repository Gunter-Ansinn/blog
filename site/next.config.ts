import type { NextConfig } from "next";

const isCI = process.env.GITHUB_ACTIONS === 'true'

const nextConfig: NextConfig = {
  // Static export for GitHub Pages — only in CI.
  // Local dev keeps full server features (admin editor, API routes).
  ...(isCI && {
    output: 'export',
    images: { unoptimized: true },
  }),
};

export default nextConfig;
