/** Proxy TLS somente para validação local do build de produção, sem dependências. */
import { readFileSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'

const target = new URL(process.env.PV_TLS_UPSTREAM ?? 'http://127.0.0.1:3001')
if (target.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) {
  throw new Error('O destino deve ser um servidor HTTP local.')
}
const cert = process.env.PV_TLS_CERT
const key = process.env.PV_TLS_KEY
if (!cert || !key)
  throw new Error('Informe PV_TLS_CERT e PV_TLS_KEY com os arquivos do certificado local.')
const port = Number(process.env.PV_TLS_PORT ?? 3002)
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Porta TLS local inválida.')

https
  .createServer({ cert: readFileSync(cert), key: readFileSync(key) }, (request, response) => {
    const upstream = http.request(
      {
        hostname: target.hostname.replace(/^\[|\]$/g, ''),
        port: target.port || 80,
        method: request.method,
        path: request.url,
        headers: {
          ...request.headers,
          'x-forwarded-proto': 'https',
          'x-forwarded-host': request.headers.host,
        },
      },
      (result) => {
        response.writeHead(result.statusCode ?? 502, result.headers)
        result.pipe(response)
      }
    )
    upstream.on('error', () => {
      if (!response.headersSent) response.writeHead(502)
      response.end('Servidor local indisponível.')
    })
    request.on('aborted', () => upstream.destroy())
    request.pipe(upstream)
  })
  .listen(port, '127.0.0.1', () => console.log(`HTTPS local: https://localhost:${port}`))
