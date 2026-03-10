import React, { useState, useEffect } from 'react'
import { Modal, FormField, Select, Input, Button } from '@gingaflow/ui'
import { Student, promoteStudent, parseStudentExtra, getTeachers } from '../services/students'
import { useSettings } from '../contexts/SettingsContext'
import { CordaPreview } from './CordaPreview'
import { toast } from 'sonner'

type Props = {
  student: Student
  onClose: () => void
  onSuccess: () => void
}

export function PromoteStudentModal({ student, onClose, onSuccess }: Props) {
  const { settings } = useSettings()
  const [loading, setLoading] = useState(false)
  
  const [newGraduation, setNewGraduation] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [teacherId, setTeacherId] = useState('')
  const [type, setType] = useState<'PROMOTION' | 'ADJUSTMENT' | 'CORRECTION'>('PROMOTION')
  const [notes, setNotes] = useState('')
  
  const [teachers, setTeachers] = useState<Pick<Student, 'id' | 'full_name' | 'notes'>[]>([])

  const extra = parseStudentExtra(student)

  useEffect(() => {
    getTeachers().then(res => setTeachers(res.data)).catch(console.error)
  }, [])

  async function handlePromote() {
    if (!newGraduation || !teacherId || !date || !type) return
    setLoading(true)
    try {
        await promoteStudent(student.id, {
            newGraduationId: newGraduation,
            date,
            teacherId,
            type,
            notes
        })
        toast.success('Graduação alterada com sucesso!')
        onSuccess()
    } catch (e: any) {
        console.error(e)
        const msg = e.response?.data?.message || e.message || 'Erro ao promover aluno'
        toast.error(msg)
    } finally {
        setLoading(false)
    }
  }

  const graduations = (settings.graduations || [])
    .filter(g => g.active !== false)
    .sort((a, b) => a.order - b.order)

  // Resolve current graduation by UUID (new system) or by name (legacy notes)
  const currentGradId = (student as any).currentGraduationId
  const currentGradObj = currentGradId
    ? graduations.find(g => (g as any).id === currentGradId)
    : graduations.find(g => g.name === extra.graduation)
  const currentOrder = currentGradObj?.order ?? -1

  const availableGraduations = graduations.filter(g => {
    if (type === 'PROMOTION') {
        return g.order > currentOrder
    }
    return true
  })

  return (
    <Modal 
        open={true} 
        title="Graduar Aluno" 
        onClose={onClose}
        primaryAction={{
            label: 'Salvar Alteração',
            onClick: handlePromote,
            disabled: !newGraduation || !teacherId || !date || !notes || (type === 'PROMOTION' && newGraduation === currentGradId) || loading,
            loading: loading
        }}
        secondaryAction={{
            label: 'Cancelar',
            onClick: onClose
        }}
    >
        <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm mb-4 border border-gray-200">
                <p><span className="font-semibold text-gray-700">Aluno:</span> {student.full_name}</p>
                <p><span className="font-semibold text-gray-700">Graduação Atual:</span> {currentGradObj?.name || extra.graduation || 'Sem graduação'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Tipo de Alteração">
                    <Select value={type} onChange={e => setType(e.target.value as any)}>
                        <option value="PROMOTION">Promoção (Exame de Faixa)</option>
                        <option value="ADJUSTMENT">Ajuste Técnico</option>
                        <option value="CORRECTION">Correção Administrativa</option>
                    </Select>
                </FormField>

                <FormField label="Data">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </FormField>
            </div>

            <FormField label="Nova Graduação">
                <Select value={newGraduation} onChange={e => setNewGraduation(e.target.value)}>
                    <option value="">Selecione...</option>
                    {availableGraduations.map(g => (
                        <option key={g.id} value={(g as any).id}>
                            {g.name} {typeof g.grau === 'number' ? `(Grau ${g.grau})` : ''}
                        </option>
                    ))}
                </Select>
            </FormField>

            <FormField label="Professor Responsável">
                <Select value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                            {t.full_name}
                        </option>
                    ))}
                </Select>
            </FormField>
            
            <FormField label="Observações">
                <textarea 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Detalhes sobre a promoção..." 
                    rows={3} 
                />
            </FormField>
        </div>
    </Modal>
  )
}
