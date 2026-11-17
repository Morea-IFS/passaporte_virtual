import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Passaporte Virtual · MOREA',
    short_name: 'Passaporte',
    description: 'Explore os pontos da SNCT e guarde suas visitas, mesmo sem conexão.',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f2e9',
    theme_color: '#3b2492',
    icons: [
      { src: '/icons/passport-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/passport-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/passport-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
