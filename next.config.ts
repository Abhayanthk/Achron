import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    silenceDeprecations: ["import", "global-builtin", "color-functions"],
    quietDeps: true,
  },
};

export default nextConfig;
