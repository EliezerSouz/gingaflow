import React, { useEffect, useState } from 'react'
import { Button, FormField, Input, Card, Select } from '@gingaflow/ui'
import { getSettings, updateSettings, SystemSettings } from '../services/settings'
import { toast } from 'sonner'

export default function SettingsFinance() {
  const [settings, setSettings] = useState<SystemSettings>({
    groupName: '',
    logoUrl: '',
    themeColor: '',
    defaultMonthlyFee: 0,
    defaultPaymentMethod: 'PIX'
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getSettings()
      setSettings({
        ...data,
        defaultMonthlyFee: data.defaultMonthlyFee || 0,
        defaultPaymentMethod: data.defaultPaymentMethod || 'PIX'
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateSettings(settings)
      setSettings({
        ...updated,
        defaultMonthlyFee: updated.defaultMonthlyFee || 0,
        defaultPaymentMethod: updated.defaultPaymentMethod || 'PIX'
      })
      toast.success('Configurações financeiras salvas com sucesso!')
    } catch (e) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Financeiro Padrão</h3>
            <p className="mt-1 text-sm text-gray-500">
              Defina os valores padrão para novos alunos. Professores não poderão alterar estes valores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Valor Mensalidade Padrão (R$)">
              <Input
                type="number"
                value={settings.defaultMonthlyFee}
                onChange={e => setSettings({ ...settings, defaultMonthlyFee: Number(e.target.value) })}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Forma de Pagamento Padrão">
              <Select
                value={settings.defaultPaymentMethod}
                onChange={e => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO">Cartão</option>
                <option value="BOLETO">Boleto</option>
              </Select>
            </FormField>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}