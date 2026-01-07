export interface DadosHistorico {
  data: string
  valor: number
  variacao?: number
  variacaoPercentual?: number
}

export interface Ativo {
  id: string
  nome: string
  simbolo: string
  tipo: 'acao' | 'fii' | 'tesouro' | 'cdb' | 'outro'
  descricao?: string
  historico: DadosHistorico[]
  cor?: string
}

export interface ComparacaoAtivos {
  ativos: Ativo[]
  periodoInicio?: string
  periodoFim?: string
}

