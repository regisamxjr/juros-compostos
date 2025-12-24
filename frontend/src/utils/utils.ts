import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string): string {
  const numericValue = value.replace(/\D/g, '')
  
  if (!numericValue) return ''
  
  const number = parseFloat(numericValue) / 100
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)
}

export function parseCurrency(value: string): number {
  const numericValue = value.replace(/\D/g, '')
  if (!numericValue) return 0
  return parseFloat(numericValue) / 100
}

export function applyCurrencyMask(value: string): string {
  const numericValue = value.replace(/\D/g, '')
  
  if (!numericValue) return ''
  
  const number = parseFloat(numericValue) / 100
  
  const formatted = number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  return formatted
}
