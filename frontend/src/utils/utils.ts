export function parseCurrency(value: string): number {
  const numericValue = value.replace(/\D/g, '')
  if (!numericValue) return 0
  return parseFloat(numericValue) / 100
}

export function applyCurrencyMask(value: string): string {
  const numericValue = value.replace(/\D/g, '')

  if (!numericValue) return ''

  const number = parseFloat(numericValue) / 100

  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
