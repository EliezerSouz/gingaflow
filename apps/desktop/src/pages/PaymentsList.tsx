import React, { useState, useEffect } from 'react'
import { Button, Icon, Table, Badge, Modal, FormField, Input, Select, Card } from '@gingaflow/ui'
import { PaymentRecord, paymentRepository } from '../repositories/paymentRepository'
import { studentRepository } from '../repositories/studentRepository'
import { Student } from '../services/students'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

export default function PaymentsList() {
    const { auth } = useAuth()
    const [payments, setPayments] = useState<PaymentRecord[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null)
    const [filterStatus, setFilterStatus] = useState<'PAGO' | 'EM_ABERTO' | 'ATRASADO' | ''>('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        loadPayments()
        loadStudents()
    }, [page, filterStatus])

    async function loadPayments() {
        setLoading(true)
        try {
            // Simplified for now: get all or filtered locally
            // In a real app we'd filter the repository call
            const studentId = undefined // Could add student filter
            const res = await paymentRepository.getByStudent(studentId || '') 
            
            let filtered = res
            if (filterStatus) {
                filtered = res.filter(p => p.status === filterStatus)
            }
            
            setPayments(filtered)
            setTotal(filtered.length)
        } catch (e) {
            console.error(e)
            toast.error('Erro ao carregar pagamentos')
        } finally {
            setLoading(false)
        }
    }

    async function loadStudents() {
        try {
            const res = await studentRepository.getAll()
            setStudents(res as any)
        } catch (e) {
            console.error(e)
        }
    }

    async function handleMarkAsPaid(payment: PaymentRecord) {
        try {
            await paymentRepository.save({
                ...payment,
                status: 'PAGO',
                paid_at: new Date().toISOString(),
                method: 'PIX'
            })
            toast.success('Pagamento marcado como pago!')
            loadPayments()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || 'Erro ao marcar pagamento como pago')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Deseja realmente excluir este pagamento?')) return

        try {
            await paymentRepository.delete(id)
            toast.success('Pagamento excluído com sucesso!')
            loadPayments()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || 'Erro ao excluir pagamento')
        }
    }

    function formatCurrency(cents: number) {
        return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
    }

    function getStatusBadge(status: string) {
        const variants: Record<string, any> = {
            PAGO: 'success',
            EM_ABERTO: 'warning',
            ATRASADO: 'warning'
        }
        return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Header com filtros */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-primary">Pagamentos</h2>
                    <p className="text-sm text-muted">Gerencie as mensalidades dos alunos</p>
                </div>
                <Button onClick={() => { setEditingPayment(null); setShowModal(true) }}>
                    <Icon name="plus" className="mr-2" />
                    Novo Pagamento
                </Button>
            </div>

            {/* Filtros */}
            <Card>
                <div className="p-4 flex items-center gap-4">
                    <FormField label="Status">
                        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                            <option value="">Todos</option>
                            <option value="PAGO">Pago</option>
                            <option value="EM_ABERTO">Em Aberto</option>
                            <option value="ATRASADO">Atrasado</option>
                        </Select>
                    </FormField>
                </div>
            </Card>

            {/* Tabela de pagamentos */}
            {loading ? (
                <div className="text-center py-8">Carregando...</div>
            ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted border-2 border-dashed rounded-lg">
                    Nenhum pagamento encontrado.
                </div>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aluno</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payments.map((payment) => {
                                    const student = students.find(s => s.id === payment.student_id)
                                    return (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-gray-900">{student?.full_name || 'Aluno removido'}</div>
                                                    <div className="text-sm text-gray-500">{student?.cpf}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{payment.period}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {formatCurrency(payment.monthly_fee_cents)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">Dia {payment.due_day}</td>
                                            <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {payment.status !== 'PAGO' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleMarkAsPaid(payment)}
                                                            title="Marcar como pago"
                                                        >
                                                            <Icon name="check" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => { setEditingPayment(payment); setShowModal(true) }}
                                                        title="Editar"
                                                    >
                                                        <Icon name="edit" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(payment.id)}
                                                        title="Excluir"
                                                    >
                                                        <Icon name="trash" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Paginação */}
            {total > 20 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted">
                        Mostrando {payments.length} de {total} pagamentos
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Anterior
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={page * 20 >= total}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Próximo
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal de criação/edição */}
            {showModal && (
                <PaymentModal
                    payment={editingPayment}
                    students={students}
                    organizationId={auth.organizationId || ''}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false)
                        loadPayments()
                    }}
                />
            )}
        </div>
    )
}

function PaymentModal({
    payment,
    students,
    organizationId,
    onClose,
    onSuccess
}: {
    payment: PaymentRecord | null
    students: Student[]
    organizationId: string
    onClose: () => void
    onSuccess: () => void
}) {
    const [formData, setFormData] = useState({
        student_id: payment?.student_id || '',
        monthly_fee: payment ? String(payment.monthly_fee_cents / 100) : '',
        due_day: payment?.due_day || 10,
        period: payment?.period || new Date().toISOString().slice(0, 7),
        status: payment?.status || 'EM_ABERTO' as 'PAGO' | 'EM_ABERTO' | 'ATRASADO',
        method: payment?.method || '',
        notes: payment?.notes || ''
    })
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (!formData.student_id || !formData.monthly_fee) {
            toast.error('Preencha todos os campos obrigatórios')
            return
        }

        setLoading(true)
        try {
            const cleanData: any = {
                organization_id: organizationId,
                student_id: formData.student_id,
                monthly_fee_cents: Math.round(parseFloat(formData.monthly_fee) * 100),
                due_day: formData.due_day,
                period: formData.period,
                status: formData.status,
                method: formData.method,
                notes: formData.notes
            }

            if (payment) {
                await paymentRepository.save({ ...cleanData, id: payment.id })
                toast.success('Pagamento atualizado com sucesso!')
            } else {
                await paymentRepository.save(cleanData)
                toast.success('Pagamento criado com sucesso!')
            }
            onSuccess()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || 'Erro ao salvar pagamento')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={true}
            title={payment ? 'Editar Pagamento' : 'Novo Pagamento'}
            onClose={onClose}
            primaryAction={{ label: loading ? 'Salvando...' : 'Salvar', onClick: handleSubmit }}
            secondaryAction={{ label: 'Cancelar', onClick: onClose }}
        >
            <div className="space-y-4">
                <FormField label="Aluno *">
                    <Select
                        value={formData.student_id}
                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                        disabled={!!payment}
                    >
                        <option value="">Selecione um aluno</option>
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>
                                {student.full_name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="Valor da Mensalidade (R$) *">
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.monthly_fee}
                        onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                        placeholder="150.00"
                    />
                </FormField>

                <FormField label="Dia de Vencimento *">
                    <Input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.due_day}
                        onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) })}
                    />
                </FormField>

                <FormField label="Período (Mês/Ano) *">
                    <Input
                        type="month"
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    />
                </FormField>

                <FormField label="Status">
                    <Select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                        <option value="EM_ABERTO">Em Aberto</option>
                        <option value="PAGO">Pago</option>
                        <option value="ATRASADO">Atrasado</option>
                    </Select>
                </FormField>

                {formData.status === 'PAGO' && (
                    <FormField label="Método de Pagamento">
                        <Select
                            value={formData.method}
                            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                        >
                            <option value="">Selecione</option>
                            <option value="PIX">PIX</option>
                            <option value="DINHEIRO">Dinheiro</option>
                            <option value="CARTAO">Cartão</option>
                            <option value="TRANSFERENCIA">Transferência</option>
                        </Select>
                    </FormField>
                )}

                <FormField label="Observações">
                    <Input
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Observações adicionais..."
                    />
                </FormField>
            </div>
        </Modal>
    )
}
