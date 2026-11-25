import http from 'node:http'
import { createCache } from './cache.mjs'
import {
  fetchCurrencies,
  fetchRates,
  isValidCurrencyCodeFormat,
  normalizeCurrencyCode,
} from './frankfurter.mjs'

const PORT = Number(process.env.PORT) || 3001
const CURRENCIES_TTL_MS = 60 * 60 * 1000 // 1h
const RATES_TTL_MS = 15 * 60 * 1000 // 15min

const cache = createCache()
let currencyCodesPromise = null

const server = http.createServer(async (req, res) => {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, { ok: true })
    }

    if (req.method === 'GET' && url.pathname === '/api/currencies') {
      return await handleCurrencies(req, res, url)
    }

    if (req.method === 'GET' && url.pathname === '/api/rates') {
      return await handleRates(req, res, url)
    }

    sendJson(res, 404, { error: 'Rota não encontrada' })
  } catch (error) {
    console.error('[api]', error)
    sendJson(res, error.status && error.status < 500 ? error.status : 502, {
      error: error.message || 'Erro interno ao consultar câmbio',
    })
  }
})

async function handleCurrencies(_req, res, url) {
  const typeFilter = url.searchParams.get('type')
  const cacheKey = `currencies:${typeFilter || 'all'}`

  const cached = cache.get(cacheKey)
  if (cached) {
    res.setHeader('X-Cache', 'HIT')
    return sendJson(res, 200, cached)
  }

  const currencies = await getAllCurrencies()
  const filtered = typeFilter
    ? currencies.filter((c) => c.type === typeFilter)
    : currencies

  const payload = {
    source: 'https://api.frankfurter.dev/v2/currencies',
    count: filtered.length,
    currencies: filtered,
  }

  cache.set(cacheKey, payload, CURRENCIES_TTL_MS)
  res.setHeader('X-Cache', 'MISS')
  return sendJson(res, 200, payload)
}

async function handleRates(_req, res, url) {
  const base = normalizeCurrencyCode(url.searchParams.get('base'))
  const quotesRaw = url.searchParams.get('quotes') || ''
  const quotes = quotesRaw
    .split(',')
    .map(normalizeCurrencyCode)
    .filter(Boolean)

  if (!base || !isValidCurrencyCodeFormat(base)) {
    return sendJson(res, 400, {
      error: 'Parâmetro base inválido. Use um código de moeda válido (ex.: EUR).',
    })
  }

  if (quotes.length === 0) {
    return sendJson(res, 400, {
      error: 'Parâmetro quotes é obrigatório (ex.: quotes=BRL).',
    })
  }

  for (const quote of quotes) {
    if (!isValidCurrencyCodeFormat(quote)) {
      return sendJson(res, 400, {
        error: `Código de moeda inválido em quotes: ${quote}`,
      })
    }
  }

  const knownCodes = await getCurrencyCodeSet()
  const unknown = [base, ...quotes].filter((code) => !knownCodes.has(code))
  if (unknown.length > 0) {
    return sendJson(res, 400, {
      error: `Código(s) de moeda não suportado(s): ${unknown.join(', ')}`,
    })
  }

  if (quotes.length === 1 && quotes[0] === base) {
    const today = new Date().toISOString().slice(0, 10)
    return sendJson(res, 200, {
      source: 'https://api.frankfurter.dev/v2/rates',
      cached: false,
      rates: [{ date: today, base, quote: base, rate: 1 }],
    })
  }

  const sortedQuotes = [...quotes].sort()
  const cacheKey = `rates:${base}:${sortedQuotes.join(',')}`
  const cached = cache.get(cacheKey)
  if (cached) {
    res.setHeader('X-Cache', 'HIT')
    return sendJson(res, 200, { ...cached, cached: true })
  }

  const rates = await fetchRates(base, sortedQuotes)
  const payload = {
    source: 'https://api.frankfurter.dev/v2/rates',
    cached: false,
    rates,
  }

  cache.set(cacheKey, payload, RATES_TTL_MS)
  res.setHeader('X-Cache', 'MISS')
  return sendJson(res, 200, payload)
}

async function getAllCurrencies() {
  const cacheKey = 'currencies:raw'
  const cached = cache.get(cacheKey)
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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API de câmbio em http://0.0.0.0:${PORT}`)
})
