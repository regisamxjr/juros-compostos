import type { Config, Context } from '@netlify/functions'
import { createCache } from './_shared/cache'
import { fetchCurrencies, json, type FrankfurterError } from './_shared/frankfurter'

const CURRENCIES_TTL_MS = 60 * 60 * 1000
const cache = createCache()

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return json(204, null)
  }

  if (req.method !== 'GET') {
    return json(405, { error: 'Método não permitido' })
  }

  try {
    const url = new URL(req.url)
    const typeFilter = url.searchParams.get('type')
    const cacheKey = `currencies:${typeFilter || 'all'}`

    const cached = cache.get<{
      source: string
      count: number
      currencies: unknown[]
    }>(cacheKey)

    if (cached) {
      return json(200, cached, { 'X-Cache': 'HIT' })
    }

    const currencies = await getAllCurrencies()
    const filtered = typeFilter
      ? currencies.filter((c: { type?: string }) => c.type === typeFilter)
      : currencies

    const payload = {
      source: 'https://api.frankfurter.dev/v2/currencies',
      count: filtered.length,
      currencies: filtered,
    }

    cache.set(cacheKey, payload, CURRENCIES_TTL_MS)
    return json(200, payload, { 'X-Cache': 'MISS' })
  } catch (error) {
    const err = error as FrankfurterError
    console.error('[api/currencies]', err)
    return json(err.status && err.status < 500 ? err.status : 502, {
      error: err.message || 'Erro interno ao consultar câmbio',
    })
  }
}

async function getAllCurrencies() {
  const cacheKey = 'currencies:raw'
  const cached = cache.get<unknown[]>(cacheKey)
  if (cached) return cached

  const currencies = await fetchCurrencies()
  cache.set(cacheKey, currencies, CURRENCIES_TTL_MS)
  return currencies
}

export const config: Config = {
  path: '/api/currencies',
  method: ['GET', 'OPTIONS'],
}
