export interface Currency {
  iso_code: string
  iso_numeric: string | null
  name: string
  symbol: string | null
  type: 'currency' | 'crypto' | 'metal' | string
  start_date: string
  end_date: string
}

export interface RateQuote {
  date: string
  base: string
  quote: string
  rate: number
}

interface CurrenciesResponse {
  source: string
  count: number
  currencies: Currency[]
}

interface RatesResponse {
  source: string
  cached: boolean
  rates: RateQuote[]
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (data?.error) return String(data.error)
    if (data?.message) return String(data.message)
  } catch {
    // ignore
  }
  return `Erro na API (${response.status})`
}

export async function getCurrencies(
  type: 'currency' | 'all' = 'currency',
  signal?: AbortSignal
): Promise<Currency[]> {
  const params = type === 'all' ? '' : `?type=${type}`
  const response = await fetch(`/api/currencies${params}`, { signal })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data = (await response.json()) as CurrenciesResponse
  return data.currencies ?? []
}

export async function getRates(
  base: string,
  quotes: string | string[],
  signal?: AbortSignal
): Promise<RateQuote[]> {
  const quotesParam = Array.isArray(quotes) ? quotes.join(',') : quotes
  const params = new URLSearchParams({
    base,
    quotes: quotesParam,
  })

  const response = await fetch(`/api/rates?${params}`, { signal })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data = (await response.json()) as RatesResponse
  return data.rates ?? []
}
