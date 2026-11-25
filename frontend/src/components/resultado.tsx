import { useMemo } from 'react'
import { ChartContainer } from './ui/chart'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { jurosComposto, jurosCompostosMensal, jurosCompostosComAporte, jurosCompostosComAporteAnual } from '../utils/formulas'

interface ResultadoProps {
    resultado: number
    capital: number
    taxa: number
    tempo: number
    unidadeTempo: 'anos' | 'meses'
    aporteMensal: number
}

type TooltipPayloadItem = {
    dataKey?: string
    name?: string
    value?: number | string
}

type CustomTooltipProps = {
    active?: boolean
    payload?: TooltipPayloadItem[]
    label?: number | string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) {
        return null
    }

    const getColor = (dataKey: string) => {
        if (dataKey === 'totalJuros') return '#f97316'
        if (dataKey === 'valorInvestido') return '#3b82f6'
        return '#000'
    }

    return (
        <div className="bg-gray-100 rounded-lg border border-gray-200 shadow-lg p-3 min-w-[180px]">
            <p className="font-semibold text-sm text-gray-700 mb-2">{`Período: ${label}`}</p>
            {payload.map((item, index) => {
                const color = getColor(item.dataKey ?? '')
                return (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                        <div 
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: color }}
                        />
                        <div className="flex-1 flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-600">{item.name}:</span>
                            <span className="text-xs font-semibold text-gray-900 ml-2">
                                R$ {typeof item.value === 'number' 
                                    ? item.value.toLocaleString('pt-BR', { 
                                        minimumFractionDigits: 2, 
                                        maximumFractionDigits: 2 
                                    })
                                    : item.value}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function Resultado({ resultado, capital, taxa, tempo, unidadeTempo, aporteMensal }: ResultadoProps) {
    const chartData = useMemo(() => {
        const data = []
        const taxaDecimal = taxa / 100
        const totalPeriodos = Math.ceil(tempo)
        const maxPontos = unidadeTempo === 'anos' ? Math.min(totalPeriodos + 1, 20) : Math.min(totalPeriodos + 1, 60)
        const step = totalPeriodos > maxPontos ? Math.ceil(totalPeriodos / maxPontos) : 1
        
        for (let i = 0; i <= totalPeriodos; i += step) {
            let totalJuros: number
            let valorInvestidoTotal: number
            
            if (unidadeTempo === 'anos') {
                if (aporteMensal > 0) {
                    const aporteAnual = aporteMensal * 12
                    totalJuros = jurosCompostosComAporteAnual(capital, taxaDecimal, i, aporteAnual)
                    valorInvestidoTotal = capital + (aporteAnual * i)
                } else {
                    totalJuros = jurosComposto(capital, taxaDecimal, i)
                    valorInvestidoTotal = capital
                }
            } else {
                if (aporteMensal > 0) {
                    totalJuros = jurosCompostosComAporte(capital, taxaDecimal, i, aporteMensal)
                    valorInvestidoTotal = capital + (aporteMensal * i)
                } else {
                    totalJuros = jurosCompostosMensal(capital, taxaDecimal, i)
                    valorInvestidoTotal = capital
                }
            }
            
            data.push({
                periodo: i,
                totalJuros: Number(totalJuros.toFixed(2)),
                valorInvestido: Number(valorInvestidoTotal.toFixed(2))
            })
        }
        
        if (data[data.length - 1]?.periodo !== totalPeriodos) {
            let valorFinal: number
            let valorInvestidoFinal: number
            
            if (unidadeTempo === 'anos') {
                if (aporteMensal > 0) {
                    const aporteAnual = aporteMensal * 12
                    valorFinal = jurosCompostosComAporteAnual(capital, taxaDecimal, totalPeriodos, aporteAnual)
                    valorInvestidoFinal = capital + (aporteAnual * totalPeriodos)
                } else {
                    valorFinal = jurosComposto(capital, taxaDecimal, totalPeriodos)
                    valorInvestidoFinal = capital
                }
            } else {
                if (aporteMensal > 0) {
                    valorFinal = jurosCompostosComAporte(capital, taxaDecimal, totalPeriodos, aporteMensal)
                    valorInvestidoFinal = capital + (aporteMensal * totalPeriodos)
                } else {
                    valorFinal = jurosCompostosMensal(capital, taxaDecimal, totalPeriodos)
                    valorInvestidoFinal = capital
                }
            }
            data.push({
                periodo: totalPeriodos,
                totalJuros: Number(valorFinal.toFixed(2)),
                valorInvestido: Number(valorInvestidoFinal.toFixed(2))
            })
        }
        
        return data
    }, [capital, taxa, tempo, unidadeTempo, aporteMensal])

    const yAxisDomain = useMemo(() => {
        const valores = chartData.map(d => d.totalJuros)
        const maxValor = Math.max(...valores, capital)
        const minValor = capital 
        
        const range = maxValor - minValor
        const padding = range * 0.05
        
        if (range < 100) {
            return [minValor, maxValor + 100]
        }
        
        return [minValor, maxValor + padding]
    }, [chartData, capital])

    const valoresCards = useMemo(() => {
        const totalPeriodos = Math.ceil(tempo)
        let valorTotalInvestido: number
        
        if (unidadeTempo === 'anos') {
            if (aporteMensal > 0) {
                const aporteAnual = aporteMensal * 12
                valorTotalInvestido = capital + (aporteAnual * totalPeriodos)
            } else {
                valorTotalInvestido = capital
            }
        } else {
            if (aporteMensal > 0) {
                valorTotalInvestido = capital + (aporteMensal * totalPeriodos)
            } else {
                valorTotalInvestido = capital
            }
        }
        
        const jurosTotal = resultado - valorTotalInvestido
        
        return {
            valorTotal: resultado,
            valorTotalInvestido,
            jurosTotal
        }
    }, [resultado, capital, tempo, unidadeTempo, aporteMensal])

    return (
        <div className="w-full space-y-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Resultado Final</h2>
                
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-100 rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Valor Total</h3>
                    <p className="text-2xl font-bold text-[#0b2545]">
                        R$ {valoresCards.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Valor final acumulado</p>
                </div>
                
                <div className="bg-gray-100 rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Valor Total Investido</h3>
                    <p className="text-2xl font-bold text-[#3b82f6]">
                        R$ {valoresCards.valorTotalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Capital inicial + aportes</p>
                </div>
                
                <div className="bg-gray-100 rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Juros Total</h3>
                    <p className="text-2xl font-bold text-[#f97316]">
                        R$ {valoresCards.jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Rendimento obtido</p>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg text-center font-semibold mb-4 text-[#0b2545]">Gráfico:</h3>
                
                <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-center items-start sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-[#f97316] border-2 border-[#f97316]"></div>
                        <div>
                            <p className="font-semibold text-sm text-[#0b2545]">Total em juros</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4  bg-[#3b82f6] border-2 border-[#3b82f6]"></div>
                        <div>
                            <p className="font-semibold text-sm text-[#0b2545]">Valor Investido</p>
                        </div>
                    </div>
                </div>
                
                <ChartContainer className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 20,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorTotalJuros" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                                </linearGradient>
                                <linearGradient id="colorValorInvestido" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300" />
                            <XAxis 
                                dataKey="periodo" 
                                className="text-xs"
                            />
                            <YAxis 
                                domain={yAxisDomain}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                className="text-xs"
                            />
                            <Tooltip 
                                content={<CustomTooltip />}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="totalJuros" 
                                stroke="#f97316" 
                                strokeWidth={2}
                                fill="url(#colorTotalJuros)"
                                fillOpacity={0.6}
                                dot={{ r: 4, fill: "#f97316" }}
                                name="Total em juros"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="valorInvestido" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                fill="url(#colorValorInvestido)"
                                fillOpacity={0.4}
                                dot={{ r: 4, fill: "#ffffff", stroke: "#3b82f6", strokeWidth: 2 }}
                                name="Valor Investido"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
        </div>
    )
}
