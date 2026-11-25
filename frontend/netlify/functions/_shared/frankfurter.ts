const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v2'

const CURRENCY_CODE_RE = /^[A-Z0-9]{2,10}$/

export type FrankfurterError = Error & {
  status?: number
  detail?: unknown
}

export function isValidCurrencyCodeFormat(code: string) {
  return CURRENCY_CODE_RE.test(code)
}

export function normalizeCurrencyCode(code: string | null) {
  return String(code ?? '').trim().toUpperCase()
}

export async function fetchCurrencies() {
  const response = await fetch(`${FRANKFURTER_BASE}/currencies`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const detail = await safeReadBody(response)
    const error = new Error(`Frankfurter /currencies falhou (${response.status})`) as FrankfurterError
    error.status = response.status
    error.detail = detail
    throw error
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    const error = new Error('Resposta inválida de /currencies') as FrankfurterError
    error.status = 502
    throw error
  }

  return data
}

export async function fetchRates(base: string, quotes: string | string[]) {
  const params = new URLSearchParams({
    base,
    quotes: Array.isArray(quotes) ? quotes.join(',') : quotes,
  })

  const response = await fetch(`${FRANKFURTER_BASE}/rates?${params}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const detail = await safeReadBody(response)
    const error = new Error(
      (detail as { message?: string } | null)?.message ||
        `Frankfurter /rates falhou (${response.status})`
    ) as FrankfurterError
    error.status = response.status === 422 ? 400 : response.status
    error.detail = detail
    throw error
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    const error = new Error('Resposta inválida de /rates') as FrankfurterError
    error.status = 502
    throw error
  }

  return data
}

async function safeReadBody(response: Response) {
  try {
    return await response.json()
  } catch {
    try {
      return { message: await response.text() }
    } catch {
      return null
    }
  }
}

export function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  const baseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers,
  }

  if (status === 204) {
    return new Response(null, { status, headers: baseHeaders })
  }

  return Response.json(body, {
    status,
    headers: baseHeaders,
  })
}
