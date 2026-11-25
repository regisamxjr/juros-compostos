import { useState } from 'react'
import { Form } from '../components/forms'
import Resultado from '../components/resultado'
import Tabela from '../components/tabela'
import Header from '../components/header'

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
        <div>
            <Header />
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
                        <h2 className="mb-4 text-center text-2xl font-bold text-gray-700">
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
        </div>
    )
}

