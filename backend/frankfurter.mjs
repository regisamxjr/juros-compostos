const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v2'

const CURRENCY_CODE_RE = /^[A-Z0-9]{2,10}$/

export function isValidCurrencyCodeFormat(code) {
  return typeof code === 'string' && CURRENCY_CODE_RE.test(code)
}

export function normalizeCurrencyCode(code) {
  return String(code ?? '').trim().toUpperCase()
}

export async function fetchCurrencies() {
  const response = await fetch(`${FRANKFURTER_BASE}/currencies`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const detail = await safeReadBody(response)
    const error = new Error(`Frankfurter /currencies falhou (${response.status})`)
    error.status = response.status
    error.detail = detail
    throw error
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    const error = new Error('Resposta inválida de /currencies')
    error.status = 502
    throw error
  }

  return data
}

export async function fetchRates(base, quotes) {
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
      detail?.message || `Frankfurter /rates falhou (${response.status})`
    )
    error.status = response.status === 422 ? 400 : response.status
    error.detail = detail
    throw error
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    const error = new Error('Resposta inválida de /rates')
    error.status = 502
    throw error
  }

  return data
}

async function safeReadBody(response) {
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
