import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const config: NextConfig = {
  transpilePackages: ["@meminios/ui", "@meminios/shared"],
  reactStrictMode: true,
  turbopack: {
    root: fileURLToPath(new URL("../..", import.meta.url)),
  },
};

export default config;
