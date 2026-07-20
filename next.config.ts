import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.111.228'],
  experimental: {
    workerThreads: false, // matikan worker threads eksperimental
    cpus: 1, // batasi CPU usage compiler
  },
};

export default nextConfig;
