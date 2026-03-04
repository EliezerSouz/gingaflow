import React, { useEffect, useState } from 'react'
import { Button, FormField, Input, Card } from '@gingaflow/ui'
import { getSettings, updateSettings, SystemSettings } from '../services/settings'
import { toast } from 'sonner'

export default function SettingsGeneral() {
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
      toast.success('Configurações salvas com sucesso!')
      window.location.reload()
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Erro ao salvar configurações')
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
            <h3 className="text-lg font-medium leading-6 text-gray-900">Identidade do Grupo</h3>
            <p className="mt-1 text-sm text-gray-500">
              Personalize como o sistema é apresentado para seus alunos e professores.
            </p>
          </div>

          <div className="space-y-4">
            <FormField label="Nome do Grupo de Capoeira">
              <Input
                value={settings.groupName}
                onChange={e => setSettings({ ...settings, groupName: e.target.value })}
                placeholder="Ex: Grupo Capoeira Brasil"
              />
            </FormField>

            <FormField label="URL do Logo (Opcional)">
              <Input
                value={settings.logoUrl}
                onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://..."
              />
              {settings.logoUrl && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Pré-visualização:</p>
                  <img src={settings.logoUrl} alt="Logo Preview" className="h-16 object-contain border rounded p-1" />
                </div>
              )}
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