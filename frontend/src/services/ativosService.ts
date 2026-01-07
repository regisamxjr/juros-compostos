import type { Ativo, DadosHistorico } from '../types/ativos'

const API_CONFIG = {
  ALPHA_VANTAGE_API_KEY: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '',
  ALPHA_VANTAGE_BASE_URL: 'https://www.alphavantage.co/query',
  BRAPI_API_KEY: import.meta.env.VITE_BRAPI_API_KEY,
  BRAPI_BASE_URL: 'https://brapi.dev/api',
} as const

export async function buscarAtivoAlphaVantage(simbolo: string): Promise<DadosHistorico[]> {
  if (!API_CONFIG.ALPHA_VANTAGE_API_KEY) {
    throw new Error('API key não configurada')
  }

  try {
    const response = await fetch(
      `${API_CONFIG.ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${simbolo}&apikey=${API_CONFIG.ALPHA_VANTAGE_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note'])
    }

    const timeSeries = data['Time Series (Daily)']
    if (!timeSeries) {
      throw new Error('Dados não encontrados')
    }

    const historico: DadosHistorico[] = []
    const datas = Object.keys(timeSeries).sort()

    for (let i = 0; i < datas.length; i++) {
      const data = datas[i]
      const valor = parseFloat(timeSeries[data]['4. close'])
      const valorAnterior = i > 0 ? parseFloat(timeSeries[datas[i - 1]]['4. close']) : valor
      const variacao = valor - valorAnterior
      const variacaoPercentual = valorAnterior > 0 ? (variacao / valorAnterior) * 100 : 0

      historico.push({
        data,
        valor,
        variacao: i > 0 ? variacao : 0,
        variacaoPercentual: i > 0 ? variacaoPercentual : 0
      })
    }

    return historico
  } catch (error) {
    console.error('Erro ao buscar dados da Alpha Vantage:', error)
    throw error
  }
}

async function buscarAtivoBrapi(simbolo: string): Promise<DadosHistorico[]> {
  try {
    const token = API_CONFIG.BRAPI_API_KEY ? `&token=${API_CONFIG.BRAPI_API_KEY}` : ''
    const url = `${API_CONFIG.BRAPI_BASE_URL}/quote/${simbolo}?interval=1d&range=1y${token}`
    
    console.log(`Buscando ativo: ${url.replace(token, '&token=***')}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro HTTP ${response.status}:`, errorText)
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`Resposta da API para ${simbolo}:`, { 
      hasResults: !!data.results, 
      resultsLength: data.results?.length,
      firstResult: data.results?.[0] ? {
        symbol: data.results[0].symbol,
        hasHistorical: !!data.results[0].historicalDataPrice,
        historicalLength: data.results[0].historicalDataPrice?.length
      } : null
    })
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    if (!data.results || data.results.length === 0) {
      throw new Error(`Dados não encontrados para o símbolo ${simbolo}`)
    }

    const resultado = data.results[0]
    
    if (!resultado.historicalDataPrice || !Array.isArray(resultado.historicalDataPrice)) {
      console.error(`Ativo ${simbolo} não tem historicalDataPrice`)
      throw new Error(`Dados históricos não encontrados para o símbolo ${simbolo}`)
    }

    if (resultado.historicalDataPrice.length === 0) {
      console.error(`Ativo ${simbolo} tem historicalDataPrice vazio`)
      throw new Error(`Nenhum dado histórico disponível para o símbolo ${simbolo}`)
    }

    const historicoOrdenado = [...resultado.historicalDataPrice].sort((a: any, b: any) => a.date - b.date)
    
    const historico: DadosHistorico[] = historicoOrdenado.map((item: any, index: number) => {
      const valor = item.close || item.adjustedClose || 0
      const valorAnterior = index > 0 ? (historicoOrdenado[index - 1].close || historicoOrdenado[index - 1].adjustedClose || valor) : valor
      const variacao = valor - valorAnterior
      const variacaoPercentual = valorAnterior > 0 ? (variacao / valorAnterior) * 100 : 0

      const dataTimestamp = item.date
      const dataFormatada = new Date(dataTimestamp * 1000).toISOString().split('T')[0]

      return {
        data: dataFormatada,
        valor: Number(valor.toFixed(2)),
        variacao: index > 0 ? Number(variacao.toFixed(2)) : 0,
        variacaoPercentual: index > 0 ? Number(variacaoPercentual.toFixed(2)) : 0
      }
    })

    if (historico.length === 0) {
      throw new Error(`Nenhum dado histórico processado para o símbolo ${simbolo}`)
    }

    console.log(`Ativo ${simbolo} carregado com sucesso: ${historico.length} pontos históricos`)
    return historico
  } catch (error) {
    console.error('Erro ao buscar dados da Brapi:', error)
    throw error
  }
}

export async function buscarAtivo(simbolo: string): Promise<Ativo | null> {
  try {
    const simboloLimpo = simbolo.trim().toUpperCase()
    console.log(`Buscando ativo: ${simboloLimpo}`)
    
    const historico = await buscarAtivoBrapi(simboloLimpo)
    
    if (!historico || historico.length === 0) {
      console.error(`Nenhum histórico encontrado para ${simboloLimpo}`)
      return null
    }
    
    console.log(`Ativo ${simboloLimpo} encontrado com ${historico.length} pontos`)
    
    return {
      id: simboloLimpo.toLowerCase(),
      nome: simboloLimpo,
      simbolo: simboloLimpo,
      tipo: 'acao',
      historico,
      cor: getCorAleatoria(simboloLimpo)
    }
  } catch (error) {
    console.error(`Erro ao buscar ativo ${simbolo}:`, error)
    return null
  }
}

function getCorAleatoria(simbolo: string): string {
  const cores = [
    '#3b82f6', '#f97316', '#10b981', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1'
  ]
  const hash = simbolo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return cores[hash % cores.length]
}

export async function buscarAtivos(simbolos: string[]): Promise<Ativo[]> {
  console.log(`Buscando ${simbolos.length} ativos:`, simbolos)
  
  const promessas = simbolos.map(simbolo => buscarAtivo(simbolo))
  const resultados = await Promise.allSettled(promessas)
  
  const ativosEncontrados = resultados
    .filter((resultado): resultado is PromiseFulfilledResult<Ativo> => 
      resultado.status === 'fulfilled' && resultado.value !== null
    )
    .map(resultado => resultado.value)
  
  const falhas = resultados.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === null))
  
  if (falhas.length > 0) {
    console.warn(`${falhas.length} ativo(s) não foram encontrados:`, simbolos.filter((_, i) => {
      const resultado = resultados[i]
      return resultado.status === 'rejected' || (resultado.status === 'fulfilled' && resultado.value === null)
    }))
  }
  
  console.log(`${ativosEncontrados.length} ativo(s) encontrado(s) com sucesso`)
  
  return ativosEncontrados
}

export async function validarAtivoDisponivel(simbolo: string): Promise<boolean> {
  try {
    const token = API_CONFIG.BRAPI_API_KEY ? `&token=${API_CONFIG.BRAPI_API_KEY}` : ''
    const url = `${API_CONFIG.BRAPI_BASE_URL}/quote/${simbolo}?interval=1d&range=1y${token}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      return false
    }
    
    const data = await response.json()
    
    if (data.error || !data.results || data.results.length === 0) {
      return false
    }
    
    const resultado = data.results[0]
    return resultado.historicalDataPrice && 
           Array.isArray(resultado.historicalDataPrice) && 
           resultado.historicalDataPrice.length > 0
  } catch (error) {
    return false
  }
}

export async function listarAtivosDisponiveis(): Promise<string[]> {
  try {
    const token = API_CONFIG.BRAPI_API_KEY ? `?token=${API_CONFIG.BRAPI_API_KEY}` : ''
    const url = `${API_CONFIG.BRAPI_BASE_URL}/available${token}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }
    
    const data = await response.json()
    
    let listaAtivos: string[] = []
    
    if (data.stocks && Array.isArray(data.stocks)) {
      listaAtivos = data.stocks
        .map((stock: any) => typeof stock === 'string' ? stock : (stock.stock || stock))
        .filter((stock: any) => typeof stock === 'string' && stock.length > 0)
    } else if (Array.isArray(data)) {
      listaAtivos = data
        .map((stock: any) => typeof stock === 'string' ? stock : (stock.stock || stock))
        .filter((stock: any) => typeof stock === 'string' && stock.length > 0)
    }
    
    return listaAtivos
  } catch (error) {
    console.error('Erro ao listar ativos disponíveis:', error)
    
    const ativosComuns = [
      'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'MGLU3',
      'RENT3', 'BBAS3', 'B3SA3', 'SUZB3', 'ELET3', 'HAPV3', 'RAIL3',
      'HGLG11', 'XPML11', 'HGRU11', 'KNRI11', 'VISC11', 'RBRP11'
    ]
    
    return ativosComuns
  }
}

export async function contarAtivosDisponiveis(): Promise<number> {
  try {
    const ativos = await listarAtivosDisponiveis()
    return ativos.length
  } catch (error) {
    console.error('Erro ao contar ativos disponíveis:', error)
    return 0
  }
}

export async function listarAtivosValidados(): Promise<string[]> {
  const ativosComuns = [
    'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'MGLU3',
    'RENT3', 'BBAS3', 'B3SA3', 'SUZB3', 'ELET3', 'HAPV3', 'RAIL3',
    'HGLG11', 'XPML11', 'HGRU11', 'KNRI11', 'VISC11', 'RBRP11',
    'BOVA11', 'SMAL11', 'IVVB11', 'BOVX11', 'IBOV11', 'BRAX11',
    'PETR3', 'VALE5', 'ITSA4', 'BBDC3', 'AZUL4', 'CYRE3', 'EGIE3',
    'ELET6', 'GGBR4', 'GOAU4', 'GOLL4', 'HAPV3', 'IRBR3', 'KLBN11',
    'LREN3', 'MRVE3', 'MULT3', 'PCAR3', 'PRIO3', 'QUAL3', 'RADL3',
    'SANB11', 'SAPR11', 'TAEE11', 'TIMS3', 'UGPA3', 'USIM5', 'VIVT3'
  ]
  
  try {
    console.log('Validando ativos comuns...')
    const validacoesComuns = await Promise.allSettled(
      ativosComuns.map(async (simbolo) => {
        try {
          const valido = await validarAtivoDisponivel(simbolo)
          return valido ? simbolo : null
        } catch {
          return null
        }
      })
    )
    
    const ativosValidos = validacoesComuns
      .filter((result): result is PromiseFulfilledResult<string> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
    
    console.log(`${ativosValidos.length} ativos validados de ${ativosComuns.length} testados`)
    
    if (ativosValidos.length === 0) {
      console.warn('Nenhum ativo validado, retornando lista comum sem validação')
      return ativosComuns
    }
    
    return ativosValidos
  } catch (error) {
    console.error('Erro ao validar ativos:', error)
    return ativosComuns
  }
}

