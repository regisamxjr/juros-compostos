import { useMemo } from 'react'
import { jurosComposto, jurosCompostosMensal } from '../utils/formulas'

interface TabelaProps {
    capital: number
    taxa: number
    tempo: number
    unidadeTempo: 'anos' | 'meses'
}

export default function Tabela({ capital, taxa, tempo, unidadeTempo }: TabelaProps) {
    const dados = useMemo(() => {
        const linhas = []
        const taxaDecimal = taxa / 100
        const totalPeriodos = Math.ceil(tempo)
        
        for (let i = 0; i <= totalPeriodos; i++) {
            let valorAnterior: number
            let valorAtual: number
            
            if (unidadeTempo === 'anos') {
                valorAnterior = i === 0 ? capital : jurosComposto(capital, taxaDecimal, i - 1)
                valorAtual = jurosComposto(capital, taxaDecimal, i)
            } else {
                valorAnterior = i === 0 ? capital : jurosCompostosMensal(capital, taxaDecimal, i - 1)
                valorAtual = jurosCompostosMensal(capital, taxaDecimal, i)
            }
            
            const juros = valorAtual - valorAnterior
            
            linhas.push({
                periodo: i,
                capitalInicial: Number(valorAnterior.toFixed(2)),
                juros: Number(juros.toFixed(2)),
                total: Number(valorAtual.toFixed(2))
            })
        }
        
        return linhas
    }, [capital, taxa, tempo, unidadeTempo])

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">
                            {unidadeTempo === 'anos' ? 'Ano' : 'Mês'}
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Capital Inicial</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Juros</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {dados.map((linha) => (
                        <tr key={linha.periodo} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">
                                {linha.periodo}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                                R$ {linha.capitalInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                                R$ {linha.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                                R$ {linha.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}