import React from 'react'
import { MetricCard, Card } from '@gingaflow/ui'

export default function Dashboard() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard icon="students" title="Total de alunos" value={128} />
        <MetricCard icon="students" title="Alunos ativos" value={112} />
        <MetricCard icon="finance" title="Inadimplentes" value={9} />
        <MetricCard icon="finance" title="Próximos vencimentos" value={23} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 text-sm font-medium">Próximos vencimentos</div>
          <div className="text-sm text-gray-600">Em breve</div>
        </Card>
        <Card>
          <div className="mb-2 text-sm font-medium">Últimos pagamentos</div>
          <div className="text-sm text-gray-600">Em breve</div>
        </Card>
      </div>
    </>
  )
}
