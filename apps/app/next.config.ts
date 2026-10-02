import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.110.138'],
  images: {
    remotePatterns: [
      new URL('https://api.midtrans.com/**'),
      new URL('https://api.sandbox.midtrans.com/**'),
      new URL('https://cdn.dummyjson.com/**'),
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
