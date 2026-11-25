import type { Config, Context } from '@netlify/functions'
import { createCache } from './_shared/cache'
import {
  fetchCurrencies,
  fetchRates,
  isValidCurrencyCodeFormat,
  json,
  normalizeCurrencyCode,
  type FrankfurterError,
} from './_shared/frankfurter'

const CURRENCIES_TTL_MS = 60 * 60 * 1000
const RATES_TTL_MS = 15 * 60 * 1000
const cache = createCache()
let currencyCodesPromise: Promise<Set<string>> | null = null

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return json(204, null)
  }

  if (req.method !== 'GET') {
    return json(405, { error: 'Método não permitido' })
  }

  try {
    const url = new URL(req.url)
    const base = normalizeCurrencyCode(url.searchParams.get('base'))
    const quotesRaw = url.searchParams.get('quotes') || ''
    const quotes = quotesRaw
      .split(',')
      .map(normalizeCurrencyCode)
      .filter(Boolean)

    if (!base || !isValidCurrencyCodeFormat(base)) {
      return json(400, {
        error: 'Parâmetro base inválido. Use um código de moeda válido (ex.: EUR).',
      })
    }

    if (quotes.length === 0) {
      return json(400, {
        error: 'Parâmetro quotes é obrigatório (ex.: quotes=BRL).',
      })
    }

    for (const quote of quotes) {
      if (!isValidCurrencyCodeFormat(quote)) {
        return json(400, {
          error: `Código de moeda inválido em quotes: ${quote}`,
        })
      }
    }

    const knownCodes = await getCurrencyCodeSet()
    const unknown = [base, ...quotes].filter((code) => !knownCodes.has(code))
    if (unknown.length > 0) {
      return json(400, {
        error: `Código(s) de moeda não suportado(s): ${unknown.join(', ')}`,
      })
    }

    if (quotes.length === 1 && quotes[0] === base) {
      const today = new Date().toISOString().slice(0, 10)
      return json(200, {
        source: 'https://api.frankfurter.dev/v2/rates',
        cached: false,
        rates: [{ date: today, base, quote: base, rate: 1 }],
      })
    }

    const sortedQuotes = [...quotes].sort()
    const cacheKey = `rates:${base}:${sortedQuotes.join(',')}`
    const cached = cache.get<{
      source: string
      cached: boolean
      rates: unknown[]
    }>(cacheKey)

    if (cached) {
      return json(200, { ...cached, cached: true }, { 'X-Cache': 'HIT' })
    }

    const rates = await fetchRates(base, sortedQuotes)
    const payload = {
      source: 'https://api.frankfurter.dev/v2/rates',
      cached: false,
      rates,
    }

    cache.set(cacheKey, payload, RATES_TTL_MS)
    return json(200, payload, { 'X-Cache': 'MISS' })
  } catch (error) {
    const err = error as FrankfurterError
    console.error('[api/rates]', err)
    return json(err.status && err.status < 500 ? err.status : 502, {
      error: err.message || 'Erro interno ao consultar câmbio',
    })
  }
}

async function getAllCurrencies() {
  const cacheKey = 'currencies:raw'
  const cached = cache.get<Array<{ iso_code: string }>>(cacheKey)
  if (cached) return cached

  const currencies = await fetchCurrencies()
  cache.set(cacheKey, currencies, CURRENCIES_TTL_MS)
  return currencies
}

async function getCurrencyCodeSet() {
  if (!currencyCodesPromise) {
    currencyCodesPromise = getAllCurrencies()
      .then((list) => new Set(list.map((c) => c.iso_code)))
      .catch((err) => {
        currencyCodesPromise = null
        throw err
      })
  }

  return currencyCodesPromise
}

export const config: Config = {
  path: '/api/rates',
  method: ['GET', 'OPTIONS'],
}
