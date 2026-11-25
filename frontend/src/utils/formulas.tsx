export const jurosComposto = (capital: number, taxa: number, tempo: number) => {
  return capital * Math.pow(1 + taxa, tempo)
}

export const jurosCompostosMensal = (capital: number, taxa: number, tempo: number) => {
  const taxaMensal = taxa / 12
  return capital * Math.pow(1 + taxaMensal, tempo)
}

export const jurosCompostosComAporte = (
  capital: number,
  taxa: number,
  tempo: number,
  aporteMensal: number
) => {
  const taxaMensal = taxa / 12
  let valor = capital

  for (let i = 0; i < tempo; i++) {
    valor = valor * (1 + taxaMensal)
    valor = valor + aporteMensal
  }

  return valor
}

export const jurosCompostosComAporteAnual = (
  capital: number,
  taxa: number,
  tempo: number,
  aporteAnual: number
) => {
  let valor = capital

  for (let i = 0; i < tempo; i++) {
    valor = valor * (1 + taxa)
    valor = valor + aporteAnual
  }

  return valor
}
