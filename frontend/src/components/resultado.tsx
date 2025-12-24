import { useMemo } from 'react'
import { ChartContainer, ChartTooltipContent } from './ui/chart'
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
        
        // Garantir que o último ponto seja sempre incluído
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

    const chartConfig = {
        totalJuros: {
            label: "Total em juros",
            color: "#f97316",
        },
        valorInvestido: {
            label: "Valor Investido",
            color: "#3b82f6",
        },
    }

    // Calcular o domínio do eixo Y baseado nos dados
    // O gráfico sempre começa do valor do aporte inicial
    const yAxisDomain = useMemo(() => {
        const valores = chartData.map(d => d.totalJuros)
        const maxValor = Math.max(...valores, capital)
        const minValor = capital // Sempre começa do capital inicial
        
        // Adicionar uma margem de 5% acima
        const range = maxValor - minValor
        const padding = range * 0.05
        
        // Se o range for muito pequeno, garantir um mínimo
        if (range < 100) {
            return [minValor, maxValor + 100]
        }
        
        return [minValor, maxValor + padding]
    }, [chartData, capital])

    const valorTotalInvestido = useMemo(() => {
        const totalPeriodos = Math.ceil(tempo)
        if (unidadeTempo === 'anos') {
            if (aporteMensal > 0) {
                const aporteAnual = aporteMensal * 12
                return capital + (aporteAnual * totalPeriodos)
            }
            return capital
        } else {
            if (aporteMensal > 0) {
                return capital + (aporteMensal * totalPeriodos)
            }
            return capital
        }
    }, [capital, aporteMensal, tempo, unidadeTempo])

    const jurosTotal = useMemo(() => {
        return resultado - valorTotalInvestido
    }, [resultado, valorTotalInvestido])

    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#eef4ed] rounded-lg shadow-md p-6 border-2 border-[#8da9c4]">
                    <h3 className="text-sm font-semibold text-[#0b2545] mb-2">Valor Total</h3>
                    <p className="text-2xl font-bold text-[#134074]">
                        R$ {resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                
                <div className="bg-[#eef4ed] rounded-lg shadow-md p-6 border-2 border-[#8da9c4]">
                    <h3 className="text-sm font-semibold text-[#0b2545] mb-2">Valor Total Investido</h3>
                    <p className="text-2xl font-bold text-[#134074]">
                        R$ {valorTotalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                
                <div className="bg-[#eef4ed] rounded-lg shadow-md p-6 border-2 border-[#8da9c4]">
                    <h3 className="text-sm font-semibold text-[#0b2545] mb-2">Juros Total</h3>
                    <p className="text-2xl font-bold text-[#134074]">
                        R$ {jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4 text-[#0b2545]">Gráfico:</h3>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
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
                                content={<ChartTooltipContent />}
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
                
                {/* Legenda */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-start sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#f97316] border-2 border-[#f97316]"></div>
                        <div>
                            <p className="font-semibold text-sm text-[#0b2545]">Total em juros</p>
                            <p className="text-xs text-gray-600">Valor total acumulado (capital inicial + juros compostos)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#3b82f6] border-2 border-[#3b82f6]"></div>
                        <div>
                            <p className="font-semibold text-sm text-[#0b2545]">Valor Investido</p>
                            <p className="text-xs text-gray-600">Capital inicial + aportes acumulados</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

