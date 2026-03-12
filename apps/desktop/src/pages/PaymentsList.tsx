import React, { useState, useEffect } from 'react'
import { Button, Icon, Badge, Modal, FormField, Input, Select, Card } from '@gingaflow/ui'
import { ReceivableRecord, receivableRepository } from '../repositories/receivableRepository'
import { studentRepository } from '../repositories/studentRepository'
import { turmaRepository } from '../repositories/turmaRepository'
import { Student, parseStudentExtra } from '../services/students'
import { Turma } from '../services/units'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

export default function PaymentsList() {
    const { auth } = useAuth()
    const [payments, setPayments] = useState<ReceivableRecord[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [loading, setLoading] = useState(false)

    // Modals
    const [showEditModal, setShowEditModal] = useState(false)
    const [showReceiveModal, setShowReceiveModal] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<ReceivableRecord | null>(null)

    // Filters
    const [filterStatus, setFilterStatus] = useState<ReceivableRecord['status'] | ''>('')
    const [filterPeriod, setFilterPeriod] = useState<string>('')
    const [filterStudent, setFilterStudent] = useState<string>('')

    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        loadPayments()
    }, [page, filterStatus, filterPeriod, filterStudent])

    async function loadData() {
        try {
            const [stdRes, turRes] = await Promise.all([
                studentRepository.getAll(),
                turmaRepository.getByUnit(auth.organizationId || '') // Workaround to get some turmas, ideally all turmas
            ])
            setStudents(stdRes as any)
            setTurmas(Array.isArray(turRes) ? turRes : [])
        } catch (e) {
            console.error(e)
        }
    }

    // Helper to compute dynamic status
    function getComputedStatus(payment: ReceivableRecord) {
        if (payment.balance <= 0) return 'PAID'
        if (payment.promise_date) return 'NEGOTIATED'

        const dueDate = new Date(`${payment.due_date}T23:59:59`)
        const hoje = new Date()

        if (hoje <= dueDate) {
            return payment.paid_value > 0 ? 'PARTIAL' : 'OPEN'
        }
        if (hoje > dueDate) {
            return payment.paid_value > 0 ? 'PARTIAL' : 'OVERDUE'
        }
        
        return payment.status
    }

    async function loadPayments() {
        setLoading(true)
        try {
            const res = await receivableRepository.getAll({
                page,
                per_page: 20,
                status: filterStatus || undefined,
                period: filterPeriod || undefined,
                student_id: filterStudent || undefined
            })
            
            // Map computed statuses
            const updatedData = res.data.map((p: ReceivableRecord) => ({
                ...p,
                status: getComputedStatus(p)
            }))
            
            setPayments(updatedData)
            setTotal(res.meta?.total || 0)
        } catch (e) {
            console.error(e)
            toast.error('Erro ao carregar pagamentos')
        } finally {
            setLoading(false)
        }
    }

    async function handleGenerateBatch() {
        if (!confirm('Deseja gerar as mensalidades (em aberto) para todos os alunos ativos no mês atual?')) return
        try {
            setGenerating(true)
            const res = await receivableRepository.generateAll() as any
            toast.success(`Foram geradas ${res.generated_count || 0} mensalidades com sucesso!`)
            loadPayments()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || 'Erro ao gerar mensalidades')
        } finally {
             setGenerating(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Deseja realmente excluir este título a receber?')) return

        try {
            await receivableRepository.delete(id)
            toast.success('Título excluído com sucesso!')
            loadPayments()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || 'Erro ao excluir título')
        }
    }

    function formatCurrency(cents: number) {
        return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
    }

    function getStatusBadge(status: string) {
        const variants: Record<string, any> = {
            PAID: 'success',
            PARTIAL: 'brand',
            OPEN: 'warning',
            OVERDUE: 'danger',
            NEGOTIATED: 'info',
            CANCELLED: 'default'
        }
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>
    }

    function openEdit(payment?: ReceivableRecord) {
        setSelectedPayment(payment || null)
        setShowEditModal(true)
    }

    function openReceive(payment: ReceivableRecord) {
        setSelectedPayment(payment)
        setShowReceiveModal(true)
    }

    function openDetails(payment: ReceivableRecord) {
        setSelectedPayment(payment)
        setShowDetailsModal(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-primary">Contas a Receber</h2>
                    <p className="text-sm text-muted">Gestão completa de mensalidades e recebíveis</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={handleGenerateBatch} disabled={generating}>
                        <Icon name="refresh" className={`mr-2 ${generating ? 'animate-spin' : ''}`} />
                        Gerar Mensalidades
                    </Button>
                    <Button onClick={() => openEdit()}>
                        <Icon name="plus" className="mr-2" />
                        Nova Fatura
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <Card>
                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FormField label="Status">
                        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                            <option value="">Todos os status</option>
                            <option value="PAID">Pago</option>
                            <option value="OPEN">Em Aberto</option>
                            <option value="OVERDUE">Atrasado</option>
                            <option value="PARTIAL">Parcial</option>
                            <option value="NEGOTIATED">Renegociado</option>
                            <option value="CANCELLED">Cancelado</option>
                        </Select>
                    </FormField>
                    <FormField label="Período">
                        <Input type="month" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} />
                    </FormField>
                    <FormField label="Aluno">
                        <Select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}>
                            <option value="">Todos os alunos</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                        </Select>
                    </FormField>
                    <div className="flex justify-end h-[38px]">
                         <Button variant="ghost" onClick={() => { setFilterStatus(''); setFilterPeriod(''); setFilterStudent(''); setPage(1) }}>Limpar Filtros</Button>
                    </div>
                </div>
            </Card>

            {/* Tabela de pagamentos */}
            {loading ? (
                <div className="text-center py-8">Carregando...</div>
            ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted border-2 border-dashed rounded-lg">
                    Nenhum recebível encontrado.
                </div>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aluno / Turma</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Atual</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payments.map((payment) => {
                                    const student = students.find(s => s.id === payment.student_id)
                                    const extra = student ? parseStudentExtra(student) : null
                                    
                                    const lastTransaction = payment.payments && payment.payments.length > 0 
                                        ? [...payment.payments].sort((a,b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())[0]
                                        : null

                                    const dueDate = new Date(`${payment.due_date}T12:00:00`)

                                    return (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-brand-600" onClick={() => openDetails(payment)}>
                                                        {student?.full_name || 'Aluno removido'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {extra?.turma ? `Turma: ${extra.turma}` : `CPF: ${student?.cpf || '-'}`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{payment.period}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(payment.balance)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                <div>{dueDate.toLocaleDateString('pt-BR')}</div>
                                                {payment.promise_date && (
                                                     <div className="text-xs text-blue-600 mt-1 font-medium">Promessa: {new Date(`${payment.promise_date}T12:00:00`).toLocaleDateString('pt-BR')}</div>
                                                )}
                                                {lastTransaction && (
                                                    <div className="text-xs text-green-600 mt-1 font-medium">Pago em: {new Date(lastTransaction.paid_at).toLocaleDateString('pt-BR')}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 cursor-pointer" onClick={() => openDetails(payment)}>{getStatusBadge(payment.status)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {(payment.status !== 'PAID') && (
                                                        <Button size="sm" onClick={() => openReceive(payment)} title="Receber Pagamento">
                                                            <Icon name="check" className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" onClick={() => openEdit(payment)} title="Editar Fatura">
                                                        <Icon name="edit" className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(payment.id)} title="Excluir">
                                                        <Icon name="trash" className="w-3 h-3 text-red-500" />
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
                        Mostrando {payments.length} de {total} registros
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                        <Button size="sm" variant="secondary" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Próximo</Button>
                    </div>
                </div>
            )}

            {showEditModal && (
                <PaymentEditModal
                    payment={selectedPayment}
                    students={students}
                    organizationId={auth.organizationId || ''}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => { setShowEditModal(false); loadPayments() }}
                />
            )}
            
            {showReceiveModal && selectedPayment && (
                <PaymentReceiveModal
                    payment={selectedPayment}
                    students={students}
                    onClose={() => setShowReceiveModal(false)}
                    onSuccess={() => { setShowReceiveModal(false); loadPayments() }}
                />
            )}

            {showDetailsModal && selectedPayment && (
                <PaymentDetailsModal
                    payment={selectedPayment}
                    students={students}
                    onClose={() => setShowDetailsModal(false)}
                    onSuccess={() => loadPayments()}
                />
            )}
        </div>
    )
}

function PaymentEditModal({ payment, students, organizationId, onClose, onSuccess }: { payment: ReceivableRecord | null, students: Student[], organizationId: string, onClose: () => void, onSuccess: () => void }) {
    const isEditing = !!payment
    const [formData, setFormData] = useState({
        student_id: payment?.student_id || '',
        period: payment?.period || new Date().toISOString().slice(0, 7),
        original_value: String((payment?.original_value || 0) / 100),
        discount: String((payment?.discount || 0) / 100),
        interest: String((payment?.interest || 0) / 100),
        fine: String((payment?.fine || 0) / 100),
        due_date: payment?.due_date || new Date().toISOString().split('T')[0],
        description: payment?.description || '',
    })
    const [loading, setLoading] = useState(false)

    async function handleSave() {
        setLoading(true)
        try {
            if (!formData.student_id) throw new Error('Selecione um aluno')
            
            const originalCents = Math.round(parseFloat(formData.original_value.replace(',', '.')) * 100) || 0
            const discount = Math.round(parseFloat(formData.discount.replace(',', '.')) * 100) || 0
            const interest = Math.round(parseFloat(formData.interest.replace(',', '.')) * 100) || 0
            const fine = Math.round(parseFloat(formData.fine.replace(',', '.')) * 100) || 0
            const finalValue = originalCents - discount + interest + fine

            const paidValue = payment?.paid_value || 0
            const balance = finalValue - paidValue

            let newStatus: any = payment?.status || 'OPEN'
            const hoje = new Date()
            const dv = new Date(`${formData.due_date}T23:59:59`)
            if (balance <= 0) newStatus = 'PAID'
            else if (paidValue > 0) newStatus = 'PARTIAL'
            else if (hoje > dv) newStatus = 'OVERDUE'
            else newStatus = 'OPEN'

            await receivableRepository.save({
                id: payment?.id,
                organization_id: organizationId,
                student_id: formData.student_id,
                period: formData.period,
                due_date: formData.due_date,
                description: formData.description,
                original_value: originalCents,
                discount,
                interest,
                fine,
                final_value: finalValue,
                paid_value: paidValue,
                balance,
                status: newStatus
            })
            
            toast.success(isEditing ? 'Título atualizado' : 'Título criado')
            onSuccess()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || 'Erro ao salvar título')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal open={true} title={isEditing ? 'Editar Título' : 'Nova Fatura'} onClose={onClose} primaryAction={{ label: 'Salvar', onClick: handleSave }} secondaryAction={{ label: 'Cancelar', onClick: onClose }}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Aluno">
                        <Select value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} disabled={isEditing}>
                            <option value="">Selecione...</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                        </Select>
                    </FormField>
                    <FormField label="Período Ref.">
                        <Input type="month" value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })} />
                    </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <FormField label="Vencimento Original">
                        <Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                    </FormField>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <FormField label="Valor Base (R$)">
                        <Input type="number" step="0.01" value={formData.original_value} onChange={e => setFormData({ ...formData, original_value: e.target.value })} />
                    </FormField>
                    <FormField label="Desc (R$)">
                        <Input type="number" step="0.01" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                    </FormField>
                    <FormField label="Juros (R$)">
                        <Input type="number" step="0.01" value={formData.interest} onChange={e => setFormData({ ...formData, interest: e.target.value })} />
                    </FormField>
                    <FormField label="Multa (R$)">
                        <Input type="number" step="0.01" value={formData.fine} onChange={e => setFormData({ ...formData, fine: e.target.value })} />
                    </FormField>
                </div>
                
                <FormField label="Descrição Livre">
                    <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Mensalidade regular..." />
                </FormField>
            </div>
        </Modal>
    )
}

function PaymentReceiveModal({ payment, students, onClose, onSuccess }: { payment: ReceivableRecord, students: Student[], onClose: () => void, onSuccess: () => void }) {
    const student = students.find(s => s.id === payment.student_id)
    
    const [formData, setFormData] = useState({
        amountPaid: String(Math.max(0, payment.balance) / 100),
        paidAt: new Date().toISOString().split('T')[0],
        method: 'PIX',
        notes: '',
        promiseDate: '',
        studentStatusAction: 'KEEP'
    })
    const [loading, setLoading] = useState(false)

    async function handleReceive() {
        setLoading(true)
        try {
            const numPaid = parseFloat(formData.amountPaid.replace(',', '.'))
            if (isNaN(numPaid) || numPaid <= 0) throw new Error('Valor recebido inválido')

            const paidCents = Math.round(numPaid * 100)

            await receivableRepository.savePayment({
                organization_id: payment.organization_id,
                receivable_id: payment.id,
                amount: paidCents,
                method: formData.method,
                paid_at: formData.paidAt + 'T12:00:00.000Z',
                notes: formData.notes
            })
            
            const newPaidTotal = payment.paid_value + paidCents
            const newSaldo = payment.final_value - newPaidTotal
            let newStatus: any = 'OPEN'
            if (newSaldo <= 0) newStatus = 'PAID'
            else if (newPaidTotal > 0) newStatus = 'PARTIAL'

            const updatedVars: any = {
                ...payment,
                status: newStatus,
                paid_value: newPaidTotal,
                balance: newSaldo
            }

            if (newSaldo > 0 && formData.promiseDate) {
                updatedVars.promise_date = formData.promiseDate
                updatedVars.status = 'NEGOTIATED'
            }

            await receivableRepository.save(updatedVars)
            await receivableRepository.saveHistory({
                 organization_id: payment.organization_id,
                 receivable_id: payment.id,
                 action: 'PAYMENT_RECEIVED',
                 old_value: String(payment.balance),
                 new_value: String(newSaldo)
            })

            if (student && formData.studentStatusAction !== 'KEEP') {
                await studentRepository.save({
                    ...student,
                    status: formData.studentStatusAction === 'BLOCK' ? 'BLOQUEADO' : 'ATIVO'
                } as any)
            }

            toast.success(`Pagamento registrado via ${formData.method}!`)
            onSuccess()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || 'Erro ao registrar pagamento')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal open={true} title="Receber Pagamento" onClose={onClose} primaryAction={{ label: 'Confirmar', onClick: handleReceive }} secondaryAction={{ label: 'Cancelar', onClick: onClose }}>
            <div className="space-y-4">
                <div className="bg-brand-50 p-4 rounded-lg flex justify-between items-center text-brand-900 border border-brand-100">
                    <div>
                        <p className="font-semibold">{student?.full_name}</p>
                        <p className="text-sm opacity-80">Período: {payment.period}</p>
                    </div>
                    <div className="text-right flex space-x-4">
                        {payment.paid_value > 0 && (
                            <div className="text-right">
                                <p className="text-xs opacity-80">Já Pago</p>
                                <p className="font-medium text-green-700">R$ {(payment.paid_value / 100).toFixed(2).replace('.', ',')}</p>
                            </div>
                        )}
                        <div className="text-right">
                            <p className="text-xs font-semibold opacity-80">{payment.paid_value > 0 ? 'Saldo Restante' : 'Valor Esperado'}</p>
                            <p className="font-bold text-lg text-brand-700">R$ {(payment.balance / 100).toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Data do Pagamento">
                        <Input type="date" value={formData.paidAt} onChange={e => setFormData({ ...formData, paidAt: e.target.value })} />
                    </FormField>
                    <FormField label="Forma de Pagamento">
                        <Select value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })}>
                            <option value="PIX">PIX</option>
                            <option value="DINHEIRO">Dinheiro Espécie</option>
                            <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                            <option value="CARTAO_DEBITO">Cartão de Débito</option>
                            <option value="TRANSFERENCIA">Transferência</option>
                        </Select>
                    </FormField>
                </div>

                <FormField label="Valor Pago Realmente (R$)">
                    <Input type="number" step="0.01" value={formData.amountPaid} onChange={e => setFormData({ ...formData, amountPaid: e.target.value })} />
                    {(() => {
                        const numPaid = parseFloat(formData.amountPaid.replace(',', '.'))
                        if (!isNaN(numPaid)) {
                            const inputCents = Math.round(numPaid * 100)
                            if (inputCents > payment.balance) {
                                return (
                                    <div className="bg-amber-100 border border-amber-300 text-amber-900 p-2 rounded text-xs mt-2">
                                        <strong>⚠️ Alerta:</strong> O valor recebido (R$ {(inputCents / 100).toFixed(2)}) é maior que a dívida de (R$ {(payment.balance / 100).toFixed(2)}).
                                    </div>
                                )
                            }
                        }
                        return null
                    })()}
                </FormField>

                <FormField label="Anotação (Recibo)">
                    <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Ex: Referente a 2 meses..." />
                </FormField>

                <div className="grid grid-cols-1 gap-4 bg-gray-50 p-3 rounded border">
                    <FormField label="Ação na Ficha do Aluno após Pagamento">
                        <Select value={formData.studentStatusAction} onChange={e => setFormData({ ...formData, studentStatusAction: e.target.value })}>
                            <option value="KEEP">Manter status atual ({student?.status})</option>
                            <option value="BLOCK">Bloquear aluno (Inadimplente)</option>
                            <option value="ACTIVATE">Ativar/Desbloquear aluno</option>
                        </Select>
                    </FormField>

                    {(() => {
                        const numPaid = parseFloat(formData.amountPaid.replace(',', '.'))
                        const isPartial = !isNaN(numPaid) && Math.round(numPaid * 100) < payment.balance
                        if (isPartial) {
                            return (
                                <FormField label="Renegociação: Promessa de acerto do restante (Data)">
                                    <Input type="date" value={formData.promiseDate} onChange={e => setFormData({ ...formData, promiseDate: e.target.value })} />
                                </FormField>
                            )
                        }
                        return null
                    })()}
                </div>
            </div>
        </Modal>
    )
}

function PaymentDetailsModal({ payment, students, onClose, onSuccess }: { payment: ReceivableRecord, students: Student[], onClose: () => void, onSuccess?: () => void }) {
    const student = students.find(s => s.id === payment.student_id)
    const extra = student ? parseStudentExtra(student) : null
    
    async function handleEstornar(transactionId: string) {
        if (!confirm('Deseja estornar (excluir) este pagamento e reabrir o saldo da fatura?')) return
        try {
            const transactionRecord = payment.payments?.find(t => t.id === transactionId)
            const amtToRevert = transactionRecord?.amount || 0

            await receivableRepository.deletePayment(transactionId)
            
            const newPaidTotal = payment.paid_value - amtToRevert
            const newSaldo = payment.final_value - newPaidTotal
            
            let newStatus: any = 'OPEN'
            const dueDate = new Date(`${payment.due_date}T23:59:59`)
            const hoje = new Date()

            if (newSaldo <= 0) newStatus = 'PAID'
            else if (newPaidTotal > 0) newStatus = 'PARTIAL'
            else if (hoje > dueDate) newStatus = 'OVERDUE'

            await receivableRepository.save({
                ...payment,
                paid_value: newPaidTotal,
                balance: newSaldo,
                status: newStatus
            })

            await receivableRepository.saveHistory({
                 organization_id: payment.organization_id,
                 receivable_id: payment.id,
                 action: 'PAYMENT_REVERTED',
                 old_value: String(payment.balance),
                 new_value: String(newSaldo)
            })
            
            toast.success('Pagamento estornado com sucesso!')
            if (onSuccess) onSuccess()
            onClose() // We close and let parent refresh to reload transactions
        } catch (e) {
             toast.error('Erro ao estornar pagamento')
        }
    }

    return (
        <Modal open={true} title="Resumo do Título / Fatura" onClose={onClose} primaryAction={{ label: 'Fechar', onClick: onClose }}>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                        <p className="text-muted text-xs">Aluno</p>
                        <p className="font-medium">{student?.full_name || '-'}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs">Vencimento Original</p>
                        <p className="font-medium">{new Date(`${payment.due_date}T12:00:00`).toLocaleDateString('pt-BR')}</p>
                    </div>
                    {payment.promise_date && (
                    <div>
                        <p className="text-muted text-xs">Data Promessa (Renegociado)</p>
                        <p className="font-medium text-blue-600">{new Date(`${payment.promise_date}T12:00:00`).toLocaleDateString('pt-BR')}</p>
                    </div>
                    )}
                </div>

                <div className="divider border-t my-4" />

                {/* Resumo Financeiro */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 border rounded-lg p-3">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted">Valor Original</span>
                            <span>R$ {(payment.original_value / 100).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted">Descontos</span>
                            <span className="text-red-500">- R$ {(payment.discount / 100).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted">Juros/Multa</span>
                            <span className="text-green-600">+ R$ {((payment.interest + payment.fine) / 100).toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                    <div className="space-y-2 border-l pl-4 flex flex-col justify-center">
                         <div className="flex justify-between font-bold">
                            <span className="text-muted">Valor Final</span>
                            <span className="text-brand-700">R$ {(payment.final_value / 100).toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                </div>

                {/* Histórico Transações */}
                <h3 className="font-medium text-sm mt-6 mb-2 flex items-center gap-2">
                    <Icon name="check" className="w-4 h-4" /> Pagamentos Confirmados
                </h3>
                
                {payment.payments && payment.payments.length > 0 ? (
                    <div className="space-y-2">
                        {payment.payments.map(t => (
                            <div key={t.id} className="p-3 border rounded flex justify-between items-center text-sm">
                                <div>
                                    <div className="font-medium text-brand-700">R$ {(t.amount / 100).toFixed(2).replace('.', ',')}</div>
                                    <div className="text-xs text-muted">{t.method} - {new Date(t.paid_at).toLocaleDateString('pt-BR')}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleEstornar(t.id)} className="text-red-500 text-xs">Estornar</Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted italic">Nenhum pagamento registrado.</p>
                )}

                <div className="mt-4 pt-4 border-t flex justify-between items-end">
                    <div>
                        <p className="text-sm text-muted mb-1">Total Já Pago:</p>
                        <p className="text-sm text-muted">Saldo Devedor Atual:</p>
                    </div>
                    <div className="text-right font-bold text-lg">
                        <p className="text-green-600">R$ {(payment.paid_value / 100).toFixed(2).replace('.', ',')}</p>
                        <p className="text-red-600">R$ {(payment.balance / 100).toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>

                 {payment.description && (
                     <div className="mt-4 pt-4 border-t">
                         <p className="text-xs text-muted">Anotações da Fatura</p>
                         <p className="text-sm">{payment.description}</p>
                     </div>
                 )}
            </div>
        </Modal>
    )
}
