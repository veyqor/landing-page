import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.20.10.2', 'localhost:3000', '127.0.0.1:3000'],
};

export default nextConfig;
