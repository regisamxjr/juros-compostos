import { useState, useMemo, useEffect, useRef } from 'react'
import { ChartContainer } from './ui/chart'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import type { Ativo } from '../types/ativos'
import { buscarAtivos, listarAtivosValidados } from '../services/ativosService'

interface ComparacaoAtivosProps {
  capitalInicial?: number
  taxaJuros?: number
  tempo?: number
  unidadeTempo?: 'anos' | 'meses'
  aporteMensal?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 min-w-[180px]">
      <p className="font-semibold text-sm text-gray-700 mb-2">{`Data: ${label}`}</p>
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
          <div 
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
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
      ))}
    </div>
  )
}

export default function ComparacaoAtivos({ 
  capitalInicial = 10000, 
  taxaJuros: _taxaJuros, 
  tempo: _tempo, 
  unidadeTempo: _unidadeTempo,
  aporteMensal: _aporteMensal = 0 
}: ComparacaoAtivosProps) {
  const [ativo1, setAtivo1] = useState<string>('')
  const [ativo2, setAtivo2] = useState<string>('')
  const [ativosDisponiveis, setAtivosDisponiveis] = useState<string[]>([])
  const [sugestoes1, setSugestoes1] = useState<string[]>([])
  const [sugestoes2, setSugestoes2] = useState<string[]>([])
  const [mostrarSugestoes1, setMostrarSugestoes1] = useState(false)
  const [mostrarSugestoes2, setMostrarSugestoes2] = useState(false)
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [carregando, setCarregando] = useState(false)
  const [carregandoLista, setCarregandoLista] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [compararAtivado, setCompararAtivado] = useState(false)
  const input1Ref = useRef<HTMLInputElement>(null)
  const input2Ref = useRef<HTMLInputElement>(null)
  const sugestoes1Ref = useRef<HTMLDivElement>(null)
  const sugestoes2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    carregarListaAtivos()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sugestoes1Ref.current && !sugestoes1Ref.current.contains(event.target as Node) && input1Ref.current && !input1Ref.current.contains(event.target as Node)) {
        setMostrarSugestoes1(false)
      }
      if (sugestoes2Ref.current && !sugestoes2Ref.current.contains(event.target as Node) && input2Ref.current && !input2Ref.current.contains(event.target as Node)) {
        setMostrarSugestoes2(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const carregarListaAtivos = async () => {
    setCarregandoLista(true)
    try {
      const lista = await listarAtivosValidados()
      setAtivosDisponiveis(lista)
      console.log(`Lista de ativos validados carregada: ${lista.length} ativos`)
    } catch (error) {
      console.error('Erro ao carregar lista de ativos:', error)
    } finally {
      setCarregandoLista(false)
    }
  }

  const listaOrdenada = useMemo(() => {
    return [...ativosDisponiveis].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [ativosDisponiveis])

  const filtrarSugestoes = (valor: string, lista: string[]) => {
    if (!valor.trim()) {
      return lista.slice(0, 50)
    }
    const valorUpper = valor.toUpperCase()
    return lista
      .filter(ativo => ativo.toUpperCase().includes(valorUpper))
      .slice(0, 50)
  }

  const handleInput1Change = (valor: string) => {
    setAtivo1(valor)
    const sugestoes = filtrarSugestoes(valor, listaOrdenada)
    setSugestoes1(sugestoes)
    setMostrarSugestoes1(sugestoes.length > 0)
    setCompararAtivado(false)
    setAtivos([])
  }

  const handleInput2Change = (valor: string) => {
    setAtivo2(valor)
    const sugestoes = filtrarSugestoes(valor, listaOrdenada)
    setSugestoes2(sugestoes)
    setMostrarSugestoes2(sugestoes.length > 0)
    setCompararAtivado(false)
    setAtivos([])
  }

  const handleInput1Focus = () => {
    const sugestoes = filtrarSugestoes(ativo1, listaOrdenada)
    setSugestoes1(sugestoes)
    setMostrarSugestoes1(sugestoes.length > 0)
  }

  const handleInput2Focus = () => {
    const sugestoes = filtrarSugestoes(ativo2, listaOrdenada)
    setSugestoes2(sugestoes)
    setMostrarSugestoes2(sugestoes.length > 0)
  }

  const selecionarAtivo1 = (simbolo: string) => {
    setAtivo1(simbolo)
    setMostrarSugestoes1(false)
    setSugestoes1([])
  }

  const selecionarAtivo2 = (simbolo: string) => {
    setAtivo2(simbolo)
    setMostrarSugestoes2(false)
    setSugestoes2([])
  }

  const chartData = useMemo(() => {
    if (ativos.length === 0) return []

    const todasDatas = new Set<string>()
    ativos.forEach(ativo => {
      ativo.historico.forEach(item => todasDatas.add(item.data))
    })

    const datasOrdenadas = Array.from(todasDatas).sort()

    return datasOrdenadas.map(data => {
      const ponto: any = { data }

      ativos.forEach(ativo => {
        const itemHistorico = ativo.historico.find(h => h.data === data)
        if (itemHistorico) {
          const primeiroValor = ativo.historico[0]?.valor || 1
          const valorNormalizado = (capitalInicial / primeiroValor) * itemHistorico.valor
          ponto[ativo.simbolo] = Number(valorNormalizado.toFixed(2))
        }
      })

      return ponto
    })
  }, [ativos, capitalInicial])

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    ativos.forEach(ativo => {
      config[ativo.simbolo] = {
        label: ativo.nome,
        color: ativo.cor || '#3b82f6'
      }
    })
    return config
  }, [ativos])

  const handleComparar = async () => {
    const ativo1Limpo = ativo1.trim().toUpperCase()
    const ativo2Limpo = ativo2.trim().toUpperCase()
    const ativosSelecionados = [ativo1Limpo, ativo2Limpo].filter(Boolean)
    
    if (ativosSelecionados.length !== 2) {
      setErro('Selecione 2 ativos diferentes para comparar.')
      return
    }
    
    if (ativo1Limpo === ativo2Limpo) {
      setErro('Os dois ativos devem ser diferentes.')
      return
    }
    
    setCompararAtivado(true)
    setCarregando(true)
    setErro(null)
    
    console.log('Iniciando comparação de ativos:', ativosSelecionados)
    
    try {
      const dados = await buscarAtivos(ativosSelecionados)
      
      console.log('Ativos carregados:', dados.map(a => ({ simbolo: a.simbolo, pontos: a.historico.length })))
      
      if (dados.length === 0) {
        setErro('Nenhum ativo encontrado. Verifique se os símbolos estão corretos e se têm dados históricos disponíveis.')
        setCompararAtivado(false)
      } else if (dados.length === 1) {
        const encontrado = dados[0].simbolo
        const faltando = ativosSelecionados.find(s => s !== encontrado)
        setErro(`Ativo ${encontrado} encontrado, mas ${faltando} não foi encontrado. Verifique o símbolo.`)
        setCompararAtivado(false)
      } else {
        setErro(null)
      }
      
      setAtivos(dados)
    } catch (error) {
      console.error('Erro ao carregar ativos:', error)
      setErro(`Erro ao carregar ativos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setCompararAtivado(false)
      setAtivos([])
    } finally {
      setCarregando(false)
    }
  }

  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, capitalInicial * 2]
    
    const todosValores: number[] = []
    chartData.forEach(ponto => {
      Object.keys(ponto).forEach(key => {
        if (key !== 'data' && typeof ponto[key] === 'number') {
          todosValores.push(ponto[key])
        }
      })
    })

    const maxValor = Math.max(...todosValores, capitalInicial)
    const minValor = Math.min(...todosValores, capitalInicial)
    const range = maxValor - minValor
    const padding = range * 0.1

    return [Math.max(0, minValor - padding), maxValor + padding]
  }, [chartData, capitalInicial])

  return (
    <div className="w-full space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-[#0b2545]">Comparação de Ativos</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione 2 ativos para comparar:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <label className="block text-xs text-gray-600 mb-1">Ativo 1</label>
                <input
                  ref={input1Ref}
                  type="text"
                  value={ativo1}
                  onChange={(e) => handleInput1Change(e.target.value)}
                  onFocus={handleInput1Focus}
                  placeholder="Digite ou selecione um ativo..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#8da9c4] bg-white text-[#0b2545] placeholder-gray-400 focus:outline-none focus:border-[#134074] focus:ring-2 focus:ring-[#134074]/20 transition-all duration-200"
                />
                {mostrarSugestoes1 && sugestoes1.length > 0 && (
                  <div
                    ref={sugestoes1Ref}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto"
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200 bg-gray-50">
                      {ativo1.trim() ? `${sugestoes1.length} resultado(s)` : `${sugestoes1.length} ativos disponíveis`}
                    </div>
                    {sugestoes1.map((simbolo) => (
                      <button
                        key={simbolo}
                        type="button"
                        onClick={() => selecionarAtivo1(simbolo)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-medium text-[#0b2545]">{simbolo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs text-gray-600 mb-1">Ativo 2</label>
                <input
                  ref={input2Ref}
                  type="text"
                  value={ativo2}
                  onChange={(e) => handleInput2Change(e.target.value)}
                  onFocus={handleInput2Focus}
                  placeholder="Digite ou selecione um ativo..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#8da9c4] bg-white text-[#0b2545] placeholder-gray-400 focus:outline-none focus:border-[#134074] focus:ring-2 focus:ring-[#134074]/20 transition-all duration-200"
                />
                {mostrarSugestoes2 && sugestoes2.length > 0 && (
                  <div
                    ref={sugestoes2Ref}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto"
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200 bg-gray-50">
                      {ativo2.trim() ? `${sugestoes2.length} resultado(s)` : `${sugestoes2.length} ativos disponíveis`}
                    </div>
                    {sugestoes2.map((simbolo) => (
                      <button
                        key={simbolo}
                        type="button"
                        onClick={() => selecionarAtivo2(simbolo)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-medium text-[#0b2545]">{simbolo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {carregandoLista && (
              <div className="text-xs text-gray-500 text-center mb-2">
                Carregando lista de ativos disponíveis...
              </div>
            )}

            {ativo1 && ativo2 && !compararAtivado && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleComparar}
                  disabled={carregando}
                  className="bg-[#134074] hover:bg-[#13315c] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#134074] focus:ring-offset-2"
                >
                  {carregando ? 'Carregando...' : 'Comparar'}
                </button>
              </div>
            )}
          </div>

          {erro && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              {erro}
            </div>
          )}

          {carregando && (
            <div className="text-center py-4 text-gray-600">
              Carregando dados dos ativos...
            </div>
          )}
        </div>
      </div>

      {compararAtivado && ativos.length === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {ativos.map(ativo => {
            const primeiroValor = ativo.historico[0]?.valor || 0
            const ultimoValor = ativo.historico[ativo.historico.length - 1]?.valor || 0
            const valorAtual = ultimoValor
            const variacaoTotal = ultimoValor - primeiroValor
            const variacaoPercentual = primeiroValor > 0 
              ? ((variacaoTotal / primeiroValor) * 100) 
              : 0
            const valorFinalNormalizado = (capitalInicial / primeiroValor) * ultimoValor
            const maiorValor = Math.max(...ativo.historico.map(h => h.valor))
            const menorValor = Math.min(...ativo.historico.map(h => h.valor))

            return (
              <div key={ativo.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#0b2545]">{ativo.simbolo}</h3>
                    <p className="text-sm text-gray-600">{ativo.nome}</p>
                  </div>
                  <div 
                    className="w-6 h-6 rounded-sm"
                    style={{ backgroundColor: ativo.cor || '#3b82f6' }}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Atual:</span>
                    <span className="text-lg font-bold text-[#0b2545]">
                      R$ {valorAtual.toLocaleString('pt-BR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Variação no Período:</span>
                    <span className={`text-lg font-bold ${variacaoPercentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variacaoPercentual >= 0 ? '+' : ''}{variacaoPercentual.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Final (Normalizado):</span>
                    <span className="text-lg font-bold text-[#134074]">
                      R$ {valorFinalNormalizado.toLocaleString('pt-BR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-500">Maior Valor:</span>
                      <p className="text-sm font-semibold text-gray-700">
                        R$ {maiorValor.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Menor Valor:</span>
                      <p className="text-sm font-semibold text-gray-700">
                        R$ {menorValor.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {compararAtivado && chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-[#0b2545]">
            Evolução Comparativa (Capital Inicial: R$ {capitalInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          </h3>

          <div className="mb-4 flex flex-wrap gap-4 justify-center">
            {ativos.map(ativo => (
              <div key={ativo.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: ativo.cor || '#3b82f6' }}
                />
                <span className="text-sm font-medium">{ativo.nome} ({ativo.simbolo})</span>
              </div>
            ))}
          </div>

          <ChartContainer config={chartConfig} className="h-[500px] w-full">
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
                  {ativos.map(ativo => (
                    <linearGradient
                      key={ativo.id}
                      id={`color${ativo.simbolo}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={ativo.cor || '#3b82f6'} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={ativo.cor || '#3b82f6'} stopOpacity={0.1}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300" />
                <XAxis 
                  dataKey="data" 
                  className="text-xs"
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}`
                  }}
                />
                <YAxis 
                  domain={yAxisDomain}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {ativos.map(ativo => (
                  <Area
                    key={ativo.id}
                    type="monotone"
                    dataKey={ativo.simbolo}
                    stroke={ativo.cor || '#3b82f6'}
                    strokeWidth={2}
                    fill={`url(#color${ativo.simbolo})`}
                    fillOpacity={0.6}
                    dot={{ r: 3 }}
                    name={ativo.nome}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </div>
  )
}

