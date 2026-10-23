import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  cacheComponents: true,
  experimental: {
    // Capa + logomarca de um ponto (5 MB cada) passam pela Server Action
    serverActions: { bodySizeLimit: '12mb' },
  },
  partialPrefetching: true,
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
