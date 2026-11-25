import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import currencies from './netlify/functions/currencies'
import rates from './netlify/functions/rates'

type Handler = (req: Request) => Promise<Response>

async function pipeToNode(
  req: IncomingMessage,
  res: ServerResponse,
  handler: Handler
) {
  const host = req.headers.host || '127.0.0.1'
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) value.forEach((item) => headers.append(key, item))
  }

  const request = new Request(`http://${host}${req.url}`, {
    method: req.method,
    headers,
  })

  const response = await handler(request)
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  if (response.status === 204) {
    res.end()
    return
  }

  const body = Buffer.from(await response.arrayBuffer())
  res.end(body)
}

/**
 * Serve as Netlify Functions /api/* no Vite local, sem backend separado.
 */
export function localCurrencyApi(): Plugin {
  return {
    name: 'local-currency-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''

        try {
          if (url.startsWith('/api/currencies')) {
            await pipeToNode(req, res, currencies as Handler)
            return
          }
          if (url.startsWith('/api/rates')) {
            await pipeToNode(req, res, rates as Handler)
            return
          }
        } catch (error) {
          console.error('[local-currency-api]', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Erro interno na API local' }))
          return
        }

        next()
      })
    },
  }
}
