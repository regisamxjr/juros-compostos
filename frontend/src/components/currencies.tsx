import { useMemo, useState, type ChangeEvent } from 'react'
import { useCurrencyConverter } from '../hooks/useCurrencyConverter'
import { applyCurrencyMask, parseCurrency } from '../utils/utils'
import type { Currency } from '../services/currencies'

const COUNTRY_BY_CURRENCY: Record<string, string> = {
  USD: 'US',
  EUR: 'EU',
  BRL: 'BR',
  GBP: 'GB',
  JPY: 'JP',
  CAD: 'CA',
  AUD: 'AU',
  CHF: 'CH',
  CNY: 'CN',
  ARS: 'AR',
  MXN: 'MX',
  CLP: 'CL',
  COP: 'CO',
  PEN: 'PE',
  UYU: 'UY',
  NZD: 'NZ',
  SEK: 'SE',
  NOK: 'NO',
  DKK: 'DK',
  PLN: 'PL',
  TRY: 'TR',
  INR: 'IN',
  ZAR: 'ZA',
  KRW: 'KR',
  SGD: 'SG',
  HKD: 'HK',
  TWD: 'TW',
  THB: 'TH',
  PHP: 'PH',
  IDR: 'ID',
  MYR: 'MY',
  RUB: 'RU',
  AED: 'AE',
  SAR: 'SA',
  ILS: 'IL',
}

function flagEmoji(isoCode: string) {
  if (isoCode === 'EUR') return '🇪🇺'
  const country = COUNTRY_BY_CURRENCY[isoCode] ?? isoCode.slice(0, 2)
  if (country.length !== 2) return '💱'
  const points = [...country.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...points)
}

function formatRate(rate: number) {
  return rate.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

function formatAmount(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatUpdatedAt(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

function CurrencySide({
  id,
  currency,
  currencies,
  onChange,
}: {
  id: string
  currency: Currency | undefined
  currencies: Currency[]
  onChange: (code: string) => void
}) {
  return (
    <label className="relative flex min-w-0 flex-1 items-center gap-3 cursor-pointer">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0f8] text-xl">
        {currency ? flagEmoji(currency.iso_code) : '💱'}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-base font-bold text-[#0b2545]">
          {currency?.iso_code ?? '—'}
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#8da9c4]" aria-hidden>
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <span className="block truncate text-sm text-gray-500">
          {currency?.name ?? 'Selecionar'}
        </span>
      </span>
      <select
        id={id}
        value={currency?.iso_code ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Selecionar moeda"
      >
        {currencies.map((item) => (
          <option key={item.iso_code} value={item.iso_code}>
            {item.iso_code} — {item.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function Currencies() {
  const {
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
    reloadCurrencies,
  } = useCurrencyConverter('USD', 'BRL')

  const [amountMasked, setAmountMasked] = useState('100,00')

  const amount = useMemo(() => parseCurrency(amountMasked), [amountMasked])

  const baseCurrency = useMemo(
    () => currencies.find((c) => c.iso_code === base),
    [base, currencies]
  )
  const quoteCurrency = useMemo(
    () => currencies.find((c) => c.iso_code === quote),
    [currencies, quote]
  )

  const rateMatchesPair = Boolean(rate && rate.base === base && rate.quote === quote)

  const converted = useMemo(() => {
    if (!rateMatchesPair || !rate || !Number.isFinite(amount)) return null
    return amount * rate.rate
  }, [amount, rate, rateMatchesPair])

  const inverseRate = useMemo(() => {
    if (!rateMatchesPair || !rate || rate.rate === 0) return null
    return 1 / rate.rate
  }, [rate, rateMatchesPair])

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountMasked(applyCurrencyMask(e.target.value))
  }

  return (
    <div className="bg-[#e8f0f8] p-5 md:p-8">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-[#134074]">Converter</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
              ↑
            </span>
            {rateMatchesPair && rate ? (
              <>Atualizado: {formatUpdatedAt(rate.date)}</>
            ) : loadingRate ? (
              <>Atualizando cotação...</>
            ) : (
              <>Aguardando cotação</>
            )}
          </p>
        </div>

        {loadingCurrencies ? (
          <div className="rounded-2xl bg-white p-8 text-center text-[#134074] shadow-sm">
            Carregando moedas...
          </div>
        ) : currenciesError ? (
          <div className="space-y-3 rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="font-medium text-red-600">{currenciesError}</p>
            <button
              type="button"
              onClick={reloadCurrencies}
              className="cursor-pointer rounded-xl bg-[#134074] px-4 py-2 font-semibold text-white"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="relative space-y-3">
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-[#0b2545]">Valor</p>
              <div className="flex items-center gap-3">
                <CurrencySide
                  id="currency-base"
                  currency={baseCurrency}
                  currencies={currencies}
                  onChange={setBase}
                />
                <input
                  id="currency-amount"
                  type="text"
                  inputMode="decimal"
                  value={amountMasked}
                  onChange={handleAmountChange}
                  className="w-[42%] min-w-[7.5rem] bg-transparent text-right text-3xl font-semibold text-[#0b2545] outline-none placeholder:text-[#8da9c4]"
                  placeholder="0,00"
                  aria-label="Valor a converter"
                />
              </div>
            </section>

            <div className="relative z-10 -my-1 flex justify-center">
              <button
                type="button"
                onClick={swap}
                aria-label="Inverter moedas"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#134074] text-white shadow-lg transition hover:bg-[#0b2545]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
                  <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-[#0b2545]">Convertido</p>
              <div className="flex items-center gap-3">
                <CurrencySide
                  id="currency-quote"
                  currency={quoteCurrency}
                  currencies={currencies}
                  onChange={setQuote}
                />
                <div className="w-[42%] min-w-[7.5rem] text-right">
                  {loadingRate && converted === null ? (
                    <span className="text-lg text-[#134074]">...</span>
                  ) : (
                    <span className="text-3xl font-semibold text-[#134074]">
                      {converted !== null ? formatAmount(converted) : '—'}
                    </span>
                  )}
                </div>
              </div>

              {rateError ? (
                <p className="mt-4 text-sm text-red-600">{rateError}</p>
              ) : rateMatchesPair && rate && inverseRate !== null ? (
                <p className="mt-4 text-xs leading-relaxed text-gray-500">
                  1 {rate.base} = {formatRate(rate.rate)} {rate.quote}
                  {' — '}
                  1 {rate.quote} = {formatRate(inverseRate)} {rate.base}
                </p>
              ) : null}
            </section>
          </div>
        )}

        <p className="text-center text-xs text-gray-500">
          Taxas de referência (Frankfurter), não cotações financeiras em tempo real.
        </p>
      </div>
    </div>
  )
}
