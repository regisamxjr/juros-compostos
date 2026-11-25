import { useEffect, useRef, useState } from 'react'
import { getCurrencies, getRates, type Currency, type RateQuote } from '../services/currencies'

interface UseCurrencyConverterResult {
  currencies: Currency[]
  loadingCurrencies: boolean
  loadingRate: boolean
  currenciesError: string | null
  rateError: string | null
  rate: RateQuote | null
  base: string
  quote: string
  setBase: (code: string) => void
  setQuote: (code: string) => void
  swap: () => void
  reloadCurrencies: () => void
}

export function useCurrencyConverter(
  defaultBase = 'EUR',
  defaultQuote = 'BRL'
): UseCurrencyConverterResult {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [loadingRate, setLoadingRate] = useState(false)
  const [currenciesError, setCurrenciesError] = useState<string | null>(null)
  const [rateError, setRateError] = useState<string | null>(null)
  const [rate, setRate] = useState<RateQuote | null>(null)
  const [base, setBase] = useState(defaultBase)
  const [quote, setQuote] = useState(defaultQuote)
  const [currenciesVersion, setCurrenciesVersion] = useState(0)

  const lastRatesKey = useRef<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoadingCurrencies(true)
      setCurrenciesError(null)

      try {
        const list = await getCurrencies('currency', controller.signal)
        if (controller.signal.aborted) return

        const sorted = [...list].sort((a, b) => a.iso_code.localeCompare(b.iso_code))
        setCurrencies(sorted)

        const codes = new Set(sorted.map((c) => c.iso_code))
        if (!codes.has(base) && sorted.length > 0) {
          setBase(sorted.find((c) => c.iso_code === 'EUR')?.iso_code ?? sorted[0].iso_code)
        }
        if (!codes.has(quote) && sorted.length > 0) {
          setQuote(sorted.find((c) => c.iso_code === 'BRL')?.iso_code ?? sorted[0].iso_code)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        setCurrencies([])
        setCurrenciesError(
          error instanceof Error ? error.message : 'Não foi possível carregar as moedas'
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCurrencies(false)
        }
      }
    }

    void load()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega só sob demanda
  }, [currenciesVersion])

  useEffect(() => {
    if (!base || !quote) return

    const key = `${base}:${quote}`
    if (lastRatesKey.current === key) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoadingRate(true)
      setRateError(null)

      try {
        const rates = await getRates(base, quote, controller.signal)
        if (controller.signal.aborted) return

        const match = rates.find((r) => r.base === base && r.quote === quote) ?? rates[0] ?? null
        setRate(match)
        lastRatesKey.current = key
      } catch (error) {
        if (controller.signal.aborted) return
        setRate(null)
        lastRatesKey.current = null
        setRateError(
          error instanceof Error ? error.message : 'Não foi possível obter a cotação'
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRate(false)
        }
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [base, quote])

  const swap = () => {
    lastRatesKey.current = null
    setRate(null)
    setRateError(null)
    setBase(quote)
    setQuote(base)
  }

  return {
    currencies,
    loadingCurrencies,
    loadingRate,
    currenciesError,
    rateError,
    rate,
    base,
    quote,
    setBase,
    setQuote,
    swap,
    reloadCurrencies: () => setCurrenciesVersion((v) => v + 1),
  }
}
