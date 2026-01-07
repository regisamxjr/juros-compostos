import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { jurosComposto, jurosCompostosMensal, jurosCompostosComAporte, jurosCompostosComAporteAnual } from '../utils/formulas'
import { parseCurrency, applyCurrencyMask } from '../utils/utils'
import ComparacaoAtivos from './comparacaoAtivos'

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
    const [abaAtiva, setAbaAtiva] = useState<'calcular' | 'comparar'>('calcular')
    const [capital, setCapital] = useState<string>('')
    const [taxa, setTaxa] = useState<string>('')
    const [tempo, setTempo] = useState<string>('')
    const [unidadeTempo, setUnidadeTempo] = useState<'anos' | 'meses'>('meses')
    const [aporteMensal, setAporteMensal] = useState<string>('')

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

    const handleClear = () => {
        setCapital('')
        setTaxa('')
        setTempo('')
        setAporteMensal('')
        setUnidadeTempo('meses')
    }

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
                        Calcular
                    </button>
                    <button
                        type="button"
                        onClick={() => setAbaAtiva('comparar')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                            abaAtiva === 'comparar'
                                ? 'bg-[#134074] text-white'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Comparar Ativos
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
                
                <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-end">
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
                    <div className="bg-[#e8f0f8] p-8">
                        <ComparacaoAtivos 
                            capitalInicial={parseCurrency(capital) || 10000}
                            taxaJuros={parseFloat(taxa.replace(/\s/g, '').replace(',', '.')) || undefined}
                            tempo={parseFloat(tempo.replace(/\s/g, '').replace(',', '.')) || undefined}
                            unidadeTempo={unidadeTempo}
                            aporteMensal={parseCurrency(aporteMensal) || 0}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}