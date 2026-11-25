import { useMemo, useState, type ChangeEvent } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { jurosCompostosComAporte } from '../utils/formulas'
import { applyCurrencyMask, parseCurrency } from '../utils/utils'
import { ChartContainer } from './ui/chart'
import { Field, MoneyInput, TextInput } from './field'

const APORTES_OPCOES = [100, 300, 500, 1000, 2000, 5000, 10000]

function formatarTempo(meses: number | null) {
  if (meses === null) return 'Não atinge no prazo simulado'
  if (meses === 0) return 'já atingida'
  if (meses === 1) return '1 mês'
  if (meses < 12) return `${meses} meses`

  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  if (resto === 0) return anos === 1 ? '1 ano' : `${anos} anos`
  const anosTxt = anos === 1 ? '1 ano' : `${anos} anos`
  const mesesTxt = resto === 1 ? '1 mês' : `${resto} meses`
  return `${anosTxt} e ${mesesTxt}`
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function Meta() {
  const [valorMeta, setValorMeta] = useState('100.000,00')
  const [aporteMensal, setAporteMensal] = useState('1.000,00')
  const [taxaAnual, setTaxaAnual] = useState('10')

  const dados = useMemo(() => {
    const metaNum = parseCurrency(valorMeta)
    const aporteNum = parseCurrency(aporteMensal)
    const taxaPercent = Number(String(taxaAnual).replace(',', '.'))

    if (!Number.isFinite(metaNum) || metaNum <= 0) return null
    if (!Number.isFinite(aporteNum) || aporteNum <= 0) return null
    if (!Number.isFinite(taxaPercent) || taxaPercent <= 0) return null

    const taxaDecimal = taxaPercent / 100
    const maxMeses = 12 * 200

    const calcularMeses = (aporte: number) => {
      for (let meses = 1; meses <= maxMeses; meses++) {
        const valor = jurosCompostosComAporte(0, taxaDecimal, meses, aporte)
        if (valor >= metaNum) return meses
      }
      return null
    }

    const mesesPessoal = calcularMeses(aporteNum)
    const aportesLista = [...new Set([...APORTES_OPCOES, Math.round(aporteNum)])].sort(
      (a, b) => a - b
    )

    const opcoes = aportesLista.map((aporte) => {
      const meses = calcularMeses(aporte)
      return {
        aporte,
        meses,
        label: `R$ ${formatarMoeda(aporte)}`,
        tempo: formatarTempo(meses),
        destaque: aporte === Math.round(aporteNum),
      }
    })

    const grafico = opcoes
      .filter((o) => o.meses !== null)
      .map((o) => ({
        aporte: o.aporte,
        meses: o.meses as number,
        destaque: o.destaque,
      }))

    return {
      metaNum,
      aporteNum,
      taxaPercent,
      mesesPessoal,
      opcoes,
      grafico,
    }
  }, [aporteMensal, taxaAnual, valorMeta])

  const handleMetaChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValorMeta(applyCurrencyMask(e.target.value))
  }

  const handleAporteChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAporteMensal(applyCurrencyMask(e.target.value))
  }

  return (
    <div className="bg-[#e8f0f8] p-6 md:p-8 space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-bold text-[#0b2545]">Sua meta pessoal</h3>
        <p className="text-sm text-gray-600">
          Descubra quanto investir por mês para chegar lá
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field id="meta-valor" label="Valor da meta" hint="Quanto você quer juntar">
          <MoneyInput
            id="meta-valor"
            value={valorMeta}
            onChange={handleMetaChange}
            placeholder="0,00"
          />
        </Field>

        <Field id="meta-aporte" label="Seu aporte mensal" hint="Quanto pode guardar por mês">
          <MoneyInput
            id="meta-aporte"
            value={aporteMensal}
            onChange={handleAporteChange}
            placeholder="0,00"
          />
        </Field>

        <Field id="meta-taxa" label="Taxa de juros" hint="Rendimento estimado ao ano">
          <TextInput
            id="meta-taxa"
            type="number"
            min={0.1}
            step={0.1}
            suffix="% a.a."
            value={taxaAnual}
            onChange={(e) => setTaxaAnual(e.target.value)}
            placeholder="10"
          />
        </Field>
      </div>

      {dados ? (
        <>
          <div className="rounded-2xl bg-[#0b2545] text-white p-6 md:p-8 text-center space-y-2 shadow-lg">
            <p className="text-sm uppercase tracking-wide text-[#8da9c4]">Resultado</p>
            <p className="text-xl md:text-2xl font-semibold leading-snug">
              Você precisa de{' '}
              <span className="text-[#f97316]">R$ {formatarMoeda(dados.aporteNum)}</span>
              {' '}por{' '}
              <span className="text-[#f97316]">
                {dados.mesesPessoal === null
                  ? 'mais de 200 anos'
                  : `${dados.mesesPessoal} ${dados.mesesPessoal === 1 ? 'mês' : 'meses'}`}
              </span>
            </p>
            <p className="text-sm text-[#c5d4e3]">
              para atingir R$ {formatarMoeda(dados.metaNum)} com {dados.taxaPercent.toLocaleString('pt-BR')}% a.a.
              {dados.mesesPessoal !== null ? ` (${formatarTempo(dados.mesesPessoal)})` : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#d7e3ef] p-5 md:p-6">
              <h4 className="text-base font-semibold text-[#0b2545] mb-4">Todas as opções</h4>
              <ul className="space-y-2">
                {dados.opcoes.map((opcao) => (
                  <li key={opcao.aporte}>
                    <button
                      type="button"
                      onClick={() => setAporteMensal(applyCurrencyMask(String(opcao.aporte * 100)))}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                        opcao.destaque
                          ? 'bg-[#134074] text-white'
                          : 'bg-[#f4f8fb] text-[#0b2545] hover:bg-[#e8f0f8]'
                      }`}
                    >
                      <span className="font-semibold">{opcao.label}/mês</span>
                      <span className={opcao.destaque ? 'text-white/90' : 'text-gray-600'}>
                        {opcao.tempo}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-[#d7e3ef] p-5 md:p-6">
              <h4 className="text-base font-semibold text-[#0b2545] mb-4">Comparativo de tempo</h4>
              <ChartContainer
                config={{ meses: { label: 'Meses' } }}
                className="h-[320px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados.grafico} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis
                      dataKey="aporte"
                      tickFormatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" unit=" m" width={40} />
                    <Tooltip
                      formatter={(value) => {
                        const meses = typeof value === 'number' ? value : Number(value)
                        return [`${meses} mês(es)`, 'Tempo']
                      }}
                      labelFormatter={(label) => `Aporte R$ ${Number(label).toLocaleString('pt-BR')}`}
                    />
                    <Bar dataKey="meses" radius={[8, 8, 0, 0]}>
                      {dados.grafico.map((item) => (
                        <Cell
                          key={item.aporte}
                          fill={item.destaque ? '#f97316' : '#134074'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-white border border-[#d7e3ef] p-6 text-center text-gray-600">
          Preencha meta, aporte e taxa para ver o resultado.
        </div>
      )}
    </div>
  )
}
