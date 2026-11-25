import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

const controlClass =
  'w-full px-4 py-3 rounded-xl border border-[#c5d4e3] bg-white text-[#0b2545] placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-[#134074] focus:ring-2 focus:ring-[#134074]/15 transition-all duration-200'

interface FieldProps {
  id: string
  label: string
  hint?: string
  children: ReactNode
}

export function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-[#334155]">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}

interface AffixedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  prefix?: string
  suffixSelect?: {
    id: string
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
  }
}

/** Input estilo banco: prefixo em caixa + campo + opcional select colado */
export function AffixedInput({
  prefix,
  suffixSelect,
  className = '',
  ...props
}: AffixedInputProps) {
  return (
    <div
      className={`flex overflow-hidden rounded-lg border border-[#d0d7de] bg-white transition focus-within:border-[#134074] focus-within:ring-2 focus-within:ring-[#134074]/15 ${className}`}
    >
      {prefix ? (
        <span className="flex shrink-0 items-center bg-[#f3f4f6] px-3 text-sm font-medium text-[#4b5563] border-r border-[#d0d7de]">
          {prefix}
        </span>
      ) : null}
      <input
        type="text"
        inputMode="decimal"
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[#0b2545] outline-none placeholder:text-gray-400"
        {...props}
      />
      {suffixSelect ? (
        <select
          id={suffixSelect.id}
          value={suffixSelect.value}
          onChange={(e) => suffixSelect.onChange(e.target.value)}
          className="shrink-0 cursor-pointer border-l border-[#d0d7de] bg-white px-3 py-3 text-sm text-[#0b2545] outline-none"
        >
          {suffixSelect.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  )
}

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  prefix?: string
}

export function MoneyInput({ prefix = 'R$', className = '', ...props }: MoneyInputProps) {
  const hasPrefix = Boolean(prefix)

  return (
    <div className="relative">
      {hasPrefix ? (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#134074]">
          {prefix}
        </span>
      ) : null}
      <input
        type="text"
        inputMode="decimal"
        className={`${controlClass} ${hasPrefix ? 'pl-12' : ''} ${className}`}
        {...props}
      />
    </div>
  )
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: string
}

export function TextInput({ suffix, className = '', ...props }: TextInputProps) {
  if (!suffix) {
    return <input className={`${controlClass} ${className}`} {...props} />
  }

  return (
    <div className="relative">
      <input className={`${controlClass} pr-14 ${className}`} {...props} />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
        {suffix}
      </span>
    </div>
  )
}

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>

export function SelectInput({ className = '', children, ...props }: SelectInputProps) {
  return (
    <select className={`${controlClass} cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  )
}
