import path from 'node:path'
import type { NextConfig } from 'next'

const publicWebHostname = (() => {
  try {
    return new URL(process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').hostname
  } catch {
    return 'localhost'
  }
})()

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  allowedDevOrigins: [publicWebHostname],
  cacheComponents: true,
  experimental: {
    agentUpgrade: 'security',
    // Capa + logomarca de um ponto (5 MB cada) passam pela Server Action
    serverActions: { bodySizeLimit: '12mb' },
  },
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'; connect-src 'self'",
          },
        ],
      },
    ]
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
