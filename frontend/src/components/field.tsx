import type { InputHTMLAttributes, ReactNode } from 'react'

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
  suffix?: string
  suffixSelect?: {
    id: string
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
  }
}

/** Input estilo banco: prefixo em caixa + campo + opcional sufixo/select */
export function AffixedInput({
  prefix,
  suffix,
  suffixSelect,
  className = '',
  ...props
}: AffixedInputProps) {
  return (
    <div
      className={`flex overflow-hidden rounded-lg border border-[#d0d7de] bg-white transition focus-within:border-[#134074] focus-within:ring-2 focus-within:ring-[#134074]/15 ${className}`}
    >
      {prefix ? (
        <span className="flex shrink-0 items-center border-r border-[#d0d7de] bg-[#f3f4f6] px-3 text-sm font-medium text-[#4b5563]">
          {prefix}
        </span>
      ) : null}
      <input
        type="text"
        inputMode="decimal"
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[#0b2545] outline-none placeholder:text-gray-400"
        {...props}
      />
      {suffix ? (
        <span className="flex shrink-0 items-center border-l border-[#d0d7de] bg-[#f3f4f6] px-3 text-sm font-medium text-[#4b5563]">
          {suffix}
        </span>
      ) : null}
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
