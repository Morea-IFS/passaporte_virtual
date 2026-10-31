/* Only static public resources enter this cache. Visitor/admin HTML, RSC and API never do. */
const CACHE = 'pv-static-v2'
const SHELL = [
  '/offline.html',
  '/offline.css',
  '/offline.js',
  '/offline-store.mjs',
  '/icons/passport-192.png',
  '/icons/passport-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('pv-') && key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (/^\/(admin|api|recuperar)(\/|$)/.test(url.pathname)) return
  // Never cache a page, flight/RSC request, image proxy or a personal server response.
  const shellAsset = !url.search && SHELL.includes(url.pathname)
  const nextAsset = !url.search && url.pathname.startsWith('/_next/static/')
  const staticAsset = shellAsset || nextAsset
  if (staticAsset) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        // Development chunk URLs are mutable across HMR/builds. Only Next's immutable
        // responses may enter this cache; all other Next assets always use the network.
        const immutable = (response) =>
          /\bimmutable\b/i.test(response.headers.get('Cache-Control') || '')
        if (cached && (shellAsset || immutable(cached))) return cached
        const response = await fetch(request)
        if (response.ok && response.type === 'basic' && (shellAsset || immutable(response))) {
          await cache.put(request, response.clone())
        }
        return response
      })
    )
    return
  }
  if (
    request.mode === 'navigate' &&
    (url.pathname === '/' || /^\/(c|passaporte)(\/|$)/.test(url.pathname))
  ) {
    const fallback = async () => (await caches.match('/offline.html')) || Response.error()
    event.respondWith(
      fetch(request)
        .then((response) => (response.status >= 500 ? fallback() : response))
        .catch(fallback)
    )
  }
})
