import * as React from "react"
import { ResponsiveContainer } from "recharts"

import { cn } from "@/utils/utils"

type ThemeConfigItem = {
  label?: React.ReactNode
  icon?: React.ComponentType
  theme: Record<string, string>
}

type ColorConfigItem = {
  label?: React.ReactNode
  icon?: React.ComponentType
  color?: string
}

type ChartConfigItem = ThemeConfigItem | ColorConfigItem

type ChartConfig = Record<string, ChartConfigItem>

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <div
      data-chart={chartId}
      ref={ref}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line-line]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      {children}
    </div>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => ("theme" in itemConfig ? !!itemConfig.theme : !!itemConfig.color)
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(config)
          .map(([key, itemConfig]) => {
            const color =
              "theme" in itemConfig
                ? itemConfig.theme[`hsl(var(--chart-${key}))`] || itemConfig.theme[key]
                : itemConfig.color
            return color
              ? [
                  `.chart-${id} [data-${key}="true"]`,
                  `[data-chart=${id}] [data-${key}="true"]`,
                ]
                  .map(
                    (selector) =>
                      `${selector} { color: ${color}; }`
                  )
                  .join("\n")
              : null
          })
          .filter(Boolean)
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean
    payload?: Array<{
      dataKey?: string | number
      name?: React.ReactNode
      value?: number | string
      color?: string
      payload?: Record<string, React.ReactNode>
    }>
    label?: React.ReactNode
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelKey,
      nameKey,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      active?: boolean
      payload?: Array<{
        dataKey?: string | number
        name?: React.ReactNode
        value?: number | string
        color?: string
        payload?: Record<string, React.ReactNode>
      }>
      label?: React.ReactNode
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    },
    ref
  ) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-md",
          className
        )}
        {...props}
      >
        {!hideLabel && (
          <div className="font-medium text-muted-foreground">
            {labelKey ? payload[0]?.payload?.[labelKey] : label}
          </div>
        )}
        {payload.map((item, index) => (
          <div
            key={`${String(item.dataKey)}-${index}`}
            className="flex items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground"
            style={
              {
                "--color": item.color,
              } as React.CSSProperties
            }
          >
            {!hideIndicator && (
              <div
                className={cn(
                  "shrink-0 rounded-[2px] border-[--color] bg-[--color]",
                  {
                    "h-2.5 w-2.5": indicator === "dot",
                    "w-1": indicator === "line",
                    "w-0 border-[1.5px] border-dashed bg-transparent":
                      indicator === "dashed",
                    "my-0.5": indicator === "dashed",
                  }
                )}
              />
            )}
            <div
              className="flex flex-1 items-center justify-between gap-4 leading-none"
              style={
                {
                  "--color": item.color,
                } as React.CSSProperties
              }
            >
              <div className="font-medium text-muted-foreground">
                {nameKey ? item.payload?.[nameKey] : item.name}
              </div>
              <div className="font-mono font-medium tabular-nums text-foreground">
                {typeof item.value === "number"
                  ? item.value.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
)
ChartTooltip.displayName = "ChartTooltip"

const ChartTooltipContent = (
  props: React.ComponentProps<typeof ChartTooltip>
) => {
  return <ChartTooltip {...props} />
}

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hideIcon?: boolean
    payload?: Array<{
      value: React.ReactNode
      type?: string
      id?: string
      color?: string
    }>
  }
>(({ className, hideIcon = false, payload, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-4 justify-center text-xs [&>*]:basis-full sm:[&>*]:basis-auto",
        className
      )}
      {...props}
    >
      {payload?.map((item) => (
        <div
          key={item.id ?? item.value?.toString()}
          className={cn(
            "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
          )}
          style={
            {
              "--color": item.color,
            } as React.CSSProperties
          }
        >
          {!hideIcon && (
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: "var(--color)",
              }}
            />
          )}
          {item.value}
        </div>
      ))}
    </div>
  )
})
ChartLegend.displayName = "ChartLegend"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
}
