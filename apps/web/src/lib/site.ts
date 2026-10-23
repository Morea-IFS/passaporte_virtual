import 'server-only'

/** Endereço público do site (o mesmo usado pela API nos QR codes) */
export const PUBLIC_WEB_URL = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  ''
)
