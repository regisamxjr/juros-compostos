import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import {
  jurosComposto,
  jurosCompostosMensal,
  jurosCompostosComAporte,
  jurosCompostosComAporteAnual,
} from '../utils/formulas'
import { parseCurrency, applyCurrencyMask } from '../utils/utils'
import Currencies from './currencies'
import Meta from './meta'
import { AffixedInput, Field } from './field'

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
  const [abaAtiva, setAbaAtiva] = useState<'calcular' | 'meta' | 'moedas'>('calcular')
  const [capital, setCapital] = useState('10.000,00')
  const [aporteMensal, setAporteMensal] = useState('2.400,00')
  const [taxa, setTaxa] = useState('10')
  const [periodoTaxa, setPeriodoTaxa] = useState<'anual' | 'mensal'>('anual')
  const [tempo, setTempo] = useState('24')
  const [unidadeTempo, setUnidadeTempo] = useState<'anos' | 'meses'>('meses')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const capitalNum = parseCurrency(capital)
    const aporteNum = parseCurrency(aporteMensal)
    const taxaClean = taxa.replace(/\s/g, '').replace(',', '.')
    const tempoClean = tempo.replace(/\s/g, '').replace(',', '.')

    const taxaInformada = parseFloat(taxaClean) / 100
    const tempoNum = parseFloat(tempoClean)

    if (isNaN(capitalNum) || capitalNum < 0) {
      alert('Por favor, insira um valor inicial válido')
      return
    }

    if (isNaN(taxaInformada) || taxaInformada <= 0) {
      alert('Por favor, insira uma taxa de juros válida e maior que zero')
      return
    }

    if (isNaN(tempoNum) || tempoNum <= 0) {
      alert('Por favor, insira um período válido e maior que zero')
      return
    }

    if (isNaN(aporteNum) || aporteNum < 0) {
      alert('Por favor, insira um valor mensal válido')
      return
    }

    // Fórmulas esperam taxa anual em decimal
    const taxaAnual = periodoTaxa === 'anual' ? taxaInformada : taxaInformada * 12

    let calculo: number

    if (unidadeTempo === 'anos') {
      if (aporteNum > 0) {
        calculo = jurosCompostosComAporteAnual(capitalNum, taxaAnual, tempoNum, aporteNum * 12)
      } else {
        calculo = jurosComposto(capitalNum, taxaAnual, tempoNum)
      }
    } else if (aporteNum > 0) {
      calculo = jurosCompostosComAporte(capitalNum, taxaAnual, tempoNum, aporteNum)
    } else {
      calculo = jurosCompostosMensal(capitalNum, taxaAnual, tempoNum)
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
      aporteMensal: aporteNum,
    })
  }

  const handleCapitalChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCapital(applyCurrencyMask(e.target.value))
  }

  const handleAporteChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAporteMensal(applyCurrencyMask(e.target.value))
  }

  const handleClear = () => {
    setCapital('')
    setAporteMensal('')
    setTaxa('')
    setTempo('')
    setPeriodoTaxa('anual')
    setUnidadeTempo('meses')
  }

  const tabClass = (ativa: boolean) =>
    `flex-1 px-4 sm:px-6 py-4 font-semibold transition-colors ${
      ativa ? 'bg-[#134074] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
    }`

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
            className={tabClass(abaAtiva === 'calcular')}
          >
            Juros Compostos
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('meta')}
            className={tabClass(abaAtiva === 'meta')}
          >
            Meta
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('moedas')}
            className={tabClass(abaAtiva === 'moedas')}
          >
            Moedas
          </button>
        </div>

        {abaAtiva === 'calcular' ? (
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 mb-8">
              <Field id="capital" label="Valor inicial">
                <AffixedInput
                  id="capital"
                  prefix="R$"
                  placeholder="0,00"
                  value={capital}
                  onChange={handleCapitalChange}
                />
              </Field>

              <Field id="aporte-mensal" label="Valor mensal">
                <AffixedInput
                  id="aporte-mensal"
                  prefix="R$"
                  placeholder="0,00"
                  value={aporteMensal}
                  onChange={handleAporteChange}
                />
              </Field>

              <Field id="taxa" label="Taxa de juros">
                <AffixedInput
                  id="taxa"
                  prefix="%"
                  placeholder="10"
                  value={taxa}
                  onChange={(e) => setTaxa(e.target.value)}
                  required
                  suffixSelect={{
                    id: 'periodo-taxa',
                    value: periodoTaxa,
                    onChange: (value) => setPeriodoTaxa(value as 'anual' | 'mensal'),
                    options: [
                      { value: 'anual', label: 'anual' },
                      { value: 'mensal', label: 'mensal' },
                    ],
                  }}
                />
              </Field>

              <Field id="tempo" label="Período">
                <AffixedInput
                  id="tempo"
                  placeholder="24"
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  required
                  suffixSelect={{
                    id: 'unidade-tempo',
                    value: unidadeTempo,
                    onChange: (value) => setUnidadeTempo(value as 'anos' | 'meses'),
                    options: [
                      { value: 'meses', label: 'mes(es)' },
                      { value: 'anos', label: 'ano(s)' },
                    ],
                  }}
                />
              </Field>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                type="submit"
                className="cursor-pointer rounded-lg bg-[#134074] px-10 py-3 font-semibold text-white shadow-sm transition hover:bg-[#0b2545]"
              >
                Calcular
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="cursor-pointer text-sm font-medium text-[#334155] transition hover:text-[#0b2545]"
              >
                Limpar
              </button>
            </div>
          </form>
        ) : abaAtiva === 'moedas' ? (
          <Currencies />
        ) : (
          <Meta />
        )}
      </div>
    </div>
  )
}
