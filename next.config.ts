import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.110.50'],
  images: {
    remotePatterns: [
      new URL('https://picsum.photos/**'),
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '9000', pathname: '/**' },
    ],
    dangerouslyAllowLocalIP: true, // izinin fetch ke private/loopback IP
  },
  experimental: {
    workerThreads: false, // matikan worker threads eksperimental
    cpus: 1, // batasi CPU usage compiler
  },
};

export default nextConfig;
