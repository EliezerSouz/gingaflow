import { http } from './http'

export type Payment = {
    id: string
    studentId: string
    monthlyFeeCents: number
    dueDay: number
    period: string
    status: 'PAGO' | 'EM_ABERTO' | 'ATRASADO'
    paidAt?: string
    method?: string
    notes?: string
    student?: {
        id: string
        full_name: string
        cpf: string
        status: string
    }
}

export type CreatePaymentData = {
    student_id: string
    monthly_fee: string
    due_day: number
    period: string
    status?: 'PAGO' | 'EM_ABERTO' | 'ATRASADO'
    paid_at?: string
    method?: string
    notes?: string
}

export async function listPayments(params: {
    page?: number
    per_page?: number
    status?: 'PAGO' | 'EM_ABERTO' | 'ATRASADO'
    student_id?: string
}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.per_page) query.set('per_page', String(params.per_page))
    if (params.status) query.set('status', params.status)
    if (params.student_id) query.set('student_id', params.student_id)

    return http<{ data: Payment[]; meta: { page: number; per_page: number; total: number; page_count: number } }>(
        `/payments?${query.toString()}`
    )
}

export async function getPayment(id: string) {
    return http<Payment>(`/payments/${id}`)
}

export async function createPayment(data: CreatePaymentData) {
    return http<Payment>('/payments', {
        method: 'POST',
        body: JSON.stringify({
            id: crypto.randomUUID(),
            ...data
        })
    })
}

export async function updatePayment(id: string, data: Partial<CreatePaymentData>) {
    return http<Payment>(`/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

export async function deletePayment(id: string) {
    return http<void>(`/payments/${id}`, {
        method: 'DELETE'
    })
}

export async function markAsPaid(id: string, method: string) {
    return updatePayment(id, {
        status: 'PAGO',
        paid_at: new Date().toISOString(),
        method
    })
}
