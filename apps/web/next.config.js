/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/health-check",
        destination: `${backendUrl}/health-check`,
      },
    ];
  },
};

export default nextConfig;
