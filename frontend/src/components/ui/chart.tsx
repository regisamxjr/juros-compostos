import type { ReactNode } from 'react'

export function ChartContainer({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`flex aspect-video justify-center text-xs ${className}`}>
      {children}
    </div>
  )
}
