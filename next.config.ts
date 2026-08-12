import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.110.50'],
  images: {
    remotePatterns: [new URL('https://picsum.photos/**')],
  },
  experimental: {
    workerThreads: false, // matikan worker threads eksperimental
    cpus: 1, // batasi CPU usage compiler
  },
};

export default nextConfig;
