import { useState } from 'react'
import { Form } from '../components/forms'
import Resultado from '../components/resultado'
import Tabela from '../components/tabela'

interface CalculoData {
    resultado: number
    capital: number
    taxa: number
    tempo: number
    unidadeTempo: 'anos' | 'meses'
    aporteMensal: number
}

export default function Home() {
    const [dadosCalculo, setDadosCalculo] = useState<CalculoData | null>(null)

    const handleCalculate = (data: CalculoData) => {
        setDadosCalculo(data)
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="max-w-4xl mx-auto">
                <Form onCalculate={handleCalculate} />
            </div>

            {dadosCalculo && (
                <div className="space-y-8">
                    <div className="max-w-4xl mx-auto">
                        <Resultado 
                            resultado={dadosCalculo.resultado}
                            capital={dadosCalculo.capital}
                            taxa={dadosCalculo.taxa}
                            tempo={dadosCalculo.tempo}
                            unidadeTempo={dadosCalculo.unidadeTempo}
                            aporteMensal={dadosCalculo.aporteMensal}
                        />
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold mb-4 text-[#0b2545]">
                            Tabela de Evolução
                        </h2>
                        <Tabela 
                            capital={dadosCalculo.capital}
                            taxa={dadosCalculo.taxa}
                            tempo={dadosCalculo.tempo}
                            unidadeTempo={dadosCalculo.unidadeTempo}
                            aporteMensal={dadosCalculo.aporteMensal}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

