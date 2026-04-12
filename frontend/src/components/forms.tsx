import { useMemo, useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { jurosComposto, jurosCompostosMensal, jurosCompostosComAporte, jurosCompostosComAporteAnual } from '../utils/formulas'
import { parseCurrency, applyCurrencyMask } from '../utils/utils'
import { ChartContainer } from './ui/chart'

interface FormProps {
    onCalculate: (data: {
        resultado: number
        capital: number
        taxa: number
        tempo: number
        unidadeTempo: 'anos' | 'meses'
        aporteMensal: number
    }) => void
}

export const Form = ({ onCalculate }: FormProps) => {
    const [abaAtiva, setAbaAtiva] = useState<'calcular' | 'meta'>('calcular')
    const [capital, setCapital] = useState<string>('')
    const [taxa, setTaxa] = useState<string>('')
    const [tempo, setTempo] = useState<string>('')
    const [unidadeTempo, setUnidadeTempo] = useState<'anos' | 'meses'>('meses')
    const [aporteMensal, setAporteMensal] = useState<string>('')
    const [valorDesejadoMeta, setValorDesejadoMeta] = useState<string>('100.000')
    const [aporteMeta, setAporteMeta] = useState<number>(5000)
    const [taxaMeta, setTaxaMeta] = useState<number>(20)

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        const capitalNum = parseCurrency(capital)
        const taxaClean = taxa.replace(/\s/g, '').replace(',', '.')
        const tempoClean = tempo.replace(/\s/g, '').replace(',', '.')
        const aporteNum = parseCurrency(aporteMensal)
        
        const taxaNum = parseFloat(taxaClean) / 100
        const tempoNum = parseFloat(tempoClean)

        if (isNaN(capitalNum) || capitalNum < 0) {
            alert('Por favor, insira um valor de capital válido')
            return
        }

        if (isNaN(taxaNum) || taxaNum <= 0) {
            alert('Por favor, insira uma taxa de juros válida e maior que zero')
            return
        }

        if (isNaN(tempoNum) || tempoNum <= 0) {
            alert('Por favor, insira um período válido e maior que zero')
            return
        }

        if (isNaN(aporteNum) || aporteNum < 0) {
            alert('Por favor, insira um valor de aporte válido')
            return
        }

        let calculo: number
        
        if (unidadeTempo === 'anos') {
            if (aporteNum > 0) {
                const aporteAnual = aporteNum * 12
                calculo = jurosCompostosComAporteAnual(capitalNum, taxaNum, tempoNum, aporteAnual)
            } else {
                calculo = jurosComposto(capitalNum, taxaNum, tempoNum)
            }
        } else {
            if (aporteNum > 0) {
                calculo = jurosCompostosComAporte(capitalNum, taxaNum, tempoNum, aporteNum)
            } else {
                calculo = jurosCompostosMensal(capitalNum, taxaNum, tempoNum)
            }
        }

        if (isNaN(calculo) || !isFinite(calculo)) {
            alert('Erro no cálculo. Por favor, verifique os valores inseridos.')
            return
        }

        onCalculate({
            resultado: calculo,
            capital: capitalNum,
            taxa: parseFloat(taxaClean),
            tempo: tempoNum,
            unidadeTempo,
            aporteMensal: aporteNum
        })
    }

    const handleCapitalChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const masked = applyCurrencyMask(value)
        setCapital(masked)
    }

    const handleAporteChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const masked = applyCurrencyMask(value)
        setAporteMensal(masked)
    }

    const handleValorDesejadoMetaChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const masked = applyCurrencyMask(value)
        setValorDesejadoMeta(masked)
    }

    const handleClear = () => {
        setCapital('')
        setTaxa('')
        setTempo('')
        setAporteMensal('')
        setUnidadeTempo('meses')
    }

    const dadosMeta = useMemo(() => {
        const capitalNum = 0
        const metaNum = parseCurrency(valorDesejadoMeta)
        const taxaPercent = taxaMeta

        if (!isFinite(capitalNum) || capitalNum < 0) return null
        if (!isFinite(metaNum) || metaNum <= 0) return null
        if (!isFinite(taxaPercent) || taxaPercent <= 0) return null

        const taxaDecimal = taxaPercent / 100
        const maxMeses = 12 * 200
        const aportesFixos = [100, 300, 500, 1000, 2000, 5000, 10000]

        const calcularMesesAteMeta = (aporteMensalFixo: number, alvo: number) => {
            if (alvo <= capitalNum) return 0

            for (let meses = 1; meses <= maxMeses; meses++) {
                const valor = jurosCompostosComAporte(capitalNum, taxaDecimal, meses, aporteMensalFixo)
                if (valor >= alvo) return meses
            }

            return null
        }

        const formatarTempo = (meses: number | null) => {
            if (meses === null) return 'Não atinge (limite)'
            const anos = Math.floor(meses / 12)
            const mesesRestantes = meses % 12
            if (anos === 0) return `${mesesRestantes} mês(es)`
            if (mesesRestantes === 0) return `${anos} ano(s)`
            return `${anos} ano(s) e ${mesesRestantes} mês(es)`
        }

        const formatarMoeda = (valor: number, casas: number = 0) =>
            valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

        const marco25 = metaNum * 0.25
        const marco100 = metaNum
        const tempo25Meses = calcularMesesAteMeta(aporteMeta, marco25)
        const tempo100Meses = calcularMesesAteMeta(aporteMeta, marco100)
        const peso25 = tempo25Meses !== null && tempo100Meses !== null && tempo100Meses > 0
            ? (tempo25Meses / tempo100Meses) * 100
            : null

        const linhasTabela = aportesFixos.map(aporte => {
            const mesesAteMeta = calcularMesesAteMeta(aporte, metaNum)
            return {
                aporte,
                aporteFormatado: `R$ ${formatarMoeda(aporte)}`,
                mesesAteMeta,
                tempoFormatado: formatarTempo(mesesAteMeta)
            }
        })

        const dadosGraficoTabela = linhasTabela
            .filter(l => l.mesesAteMeta !== null)
            .map(l => ({ aporte: l.aporte, meses: l.mesesAteMeta as number }))

        return {
            metaNum,
            linhasTabela,
            dadosGraficoTabela,
            cards: {
                tempo25: formatarTempo(tempo25Meses),
                tempo100: formatarTempo(tempo100Meses),
                peso25: peso25 === null ? '—' : `${peso25.toFixed(1)}%`
            },
            formatarMoeda
        }
    }, [aporteMeta, taxaMeta, valorDesejadoMeta])

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-[#0b2545] mb-2">
                    Veja o seu futuro nos investimentos
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-[#134074]">
                    Simulador de Juros Compostos
                </h2>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setAbaAtiva('calcular')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                            abaAtiva === 'calcular'
                                ? 'bg-[#134074] text-white'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Juros Compostos
                    </button>
                    <button
                        type="button"
                        onClick={() => setAbaAtiva('meta')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                            abaAtiva === 'meta'
                                ? 'bg-[#134074] text-white'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Meta
                    </button>
                </div>

                {abaAtiva === 'calcular' ? (
                <form onSubmit={handleSubmit} className="bg-[#e8f0f8] p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label 
                                htmlFor="capital" 
                                className="block text-sm font-semibold text-[#0b2545]"
                            >
                                Capital Inicial (R$)
                            </label>
                            <input 
                                id="capital"
                                type="text" 
                                placeholder="Digite o valor do capital" 
                                value={capital}
                                onChange={handleCapitalChange}
                                className="w-full px-4 py-3 rounded-lg border-2 border-[#8da9c4] bg-white text-[#0b2545] placeholder-gray-400 focus:outline-none focus:border-[#134074] focus:ring-2 focus:ring-[#134074]/20 transition-all duration-200"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label 
                                htmlFor="taxa" 
                                className="block text-sm font-semibold text-[#0b2545]"
                            >
                                Taxa de Juros (%)
                            </label>
                            <input 
                                id="taxa"
                                type="number" 
                                placeholder="Digite a taxa de juros" 
                                value={taxa}
                                onChange={(e) => setTaxa(e.target.value)}
                                step="0.01"
                                required
                                className="w-full px-4 py-3 rounded-lg border-2 border-[#8da9c4] bg-white text-[#0b2545] placeholder-gray-400 focus:outline-none focus:border-[#134074] focus:ring-2 focus:ring-[#134074]/20 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label 
                                htmlFor="tempo" 
                                className="block text-sm font-semibold text-[#0b2545]"
                            >
                                Período
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    id="tempo"
                                    type="number" 
                                    placeholder="Digite o período"
                                    value={tempo}
                                    onChange={(e) => setTempo(e.target.value)}
                                    step="0.01"
                                    required
                                    className="flex-1 px-4 py-3 rounded-lg border-2 border-[#8da9c4] bg-white text-[#0b2545] placeholder-gray-400 focus:outline-none focus:border-[#134074] focus:ring-2 focus:ring-[#134074]/20 transition-all duration-200"
                                />
                                <select 
                                    id="unidade-tempo"
                                    value={unidadeTempo}
                                    onChange={(e) => setUnidadeTempo(e.target.value as 'anos' | 'meses')}
                                    className="px-4 py-3 rounded-lg border-2 border-[#8da9c4] bg-white text-[#0b2545] focus:outline-none focus:border-[#134074] focus:ring-2 focus:ring-[#134074]/20 transition-all duration-200 cursor-pointer"
                                >
                                    <option value="meses">Mês</option>
                                    <option value="anos">Ano</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label 
                                htmlFor="aporte-mensal" 
                                className="block text-sm font-semibold text-[#0b2545]"
                            >
                                Aporte {unidadeTempo === 'anos' ? 'Anual' : 'Mensal'} (R$)
                            </label>
                            <input 
                                id="aporte-mensal"
                                  type="text" 
                                placeholder={`Digite o aporte ${unidadeTempo === 'anos' ? 'anual' : 'mensal'}`}
                                value={aporteMensal}
                                onChange={handleAporteChange}
                                className="w-full px-4 py-3 rounded-lg border-2 border-[#8da9c4] bg-white text-[#0b2545] placeholder-gray-400 focus:outline-none focus:border-[#134074] focus:ring-2 focus:ring-[#134074]/20 transition-all duration-200"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
                    <button 
                        type="button"
                        onClick={handleClear}
                        className="cursor-pointer bg-[#8da9c4] hover:bg-[#7a95b0] text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8da9c4] focus:ring-offset-2"
                    >
                        Limpar
                    </button>
                    <button 
                        type="submit" 
                        className="cursor-pointer flex-1 sm:flex-none sm:w-auto bg-[#134074] hover:bg-[#13315c] text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#134074] focus:ring-offset-2"
                    >
                        Calcular
                    </button>
                </div>
                </form>
                ) : (
                    <div className="bg-[#e8f0f8] p-8 space-y-6">
                        <div className="flex justify-center">
                            <div className="w-full max-w-md space-y-2 text-center">
                            <label
                                htmlFor="valor-desejado-meta"
                                className="block text-sm font-semibold text-[#0b2545]"
                            >
                                Valor desejado (R$)
                            </label>
                            <input
                                id="valor-desejado-meta"
                                type="text"
                                placeholder="Digite o valor que deseja alcançar"
                                value={valorDesejadoMeta}
                                onChange={handleValorDesejadoMetaChange}
                                className="w-full text-center px-4 py-3 rounded-lg border-2 border-[#8da9c4] bg-white text-[#0b2545] placeholder-gray-400 focus:outline-none focus:border-[#134074] focus:ring-2 focus:ring-[#134074]/20 transition-all duration-200"
                            />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                <div className="flex items-baseline justify-between gap-4">
                                    <h3 className="text-base font-semibold text-[#0b2545]">Aporte mensal</h3>
                                    <div className="text-2xl font-bold text-[#0b2545]">
                                        R$ {dadosMeta ? dadosMeta.formatarMoeda(aporteMeta) : aporteMeta.toLocaleString('pt-BR')}
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={100}
                                    max={10000}
                                    step={100}
                                    value={aporteMeta}
                                    onChange={(e) => setAporteMeta(Number(e.target.value))}
                                    className="w-full mt-4 accent-[#134074]"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>R$ 100</span>
                                    <span>R$ 10.000</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                <div className="flex items-baseline justify-between gap-4">
                                    <h3 className="text-base font-semibold text-[#0b2545]">Taxa</h3>
                                    <div className="text-2xl font-bold text-[#0b2545]">
                                        {taxaMeta.toFixed(1).replace('.', ',')}% <span className="text-sm font-medium text-gray-500">a.a.</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={6}
                                    max={20}
                                    step={0.1}
                                    value={taxaMeta}
                                    onChange={(e) => setTaxaMeta(Number(e.target.value))}
                                    className="w-full mt-4 accent-[#134074]"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>6%</span>
                                    <span>20%</span>
                                </div>
                            </div>
                        </div>

                        {dadosMeta && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Até 25% da meta</div>
                                        <div className="text-3xl font-bold text-[#134074]">{dadosMeta.cards.tempo25}</div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Até 100% da meta</div>
                                        <div className="text-3xl font-bold text-[#0b2545]">{dadosMeta.cards.tempo100}</div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Peso do 25%</div>
                                        <div className="text-3xl font-bold text-[#f97316]">{dadosMeta.cards.peso25}</div>
                                        <div className="text-xs text-gray-500 mt-1">do tempo total</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold text-[#0b2545] mb-4">Tabela de tempo para a meta</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white rounded-lg overflow-hidden border border-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-4 py-3 text-sm font-semibold text-[#0b2545]">Aporte mensal</th>
                                                    <th className="text-left px-4 py-3 text-sm font-semibold text-[#0b2545]">Tempo estimado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dadosMeta.linhasTabela.map((linha) => (
                                                    <tr key={linha.aporte} className="border-t border-gray-200">
                                                        <td className="px-4 py-3 text-sm font-medium text-[#0b2545]">{linha.aporteFormatado}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{linha.tempoFormatado}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                        <h3 className="text-lg font-semibold text-[#0b2545] mb-4">Tempo para atingir a meta por aporte</h3>
                                        <ChartContainer
                                            config={{
                                                meses: { label: 'Meses' },
                                            }}
                                            className="h-[420px] w-full"
                                        >
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={dadosMeta.dadosGraficoTabela} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300" />
                                                    <XAxis dataKey="aporte" tickFormatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} className="text-xs" />
                                                    <YAxis className="text-xs" />
                                                    <Tooltip
                                                        formatter={(value) => {
                                                            const meses = typeof value === 'number' ? value : Number(value)
                                                            return `${meses} mês(es)`
                                                        }}
                                                    />
                                                    <Bar dataKey="meses" fill="#134074" radius={[6, 6, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
