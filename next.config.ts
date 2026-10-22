import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/@:handle", destination: "/u/:handle" }];
  },
};

export default nextConfig;
