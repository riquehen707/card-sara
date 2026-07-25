import type { NextConfig } from "next";

const githubOwner = process.env.GITHUB_OWNER ?? "riquehen707";
const githubRepo = process.env.GITHUB_REPO ?? "card-sara";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: `/${githubOwner}/${githubRepo}/**`,
      },
    ],
  },
};

export default nextConfig;
