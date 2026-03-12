import { getDb } from '../lib/db';
import { syncService } from '../services/SyncService';
import { http } from '../services/http';

export interface ReceivableRecord {
    id: string;
    organization_id: string;
    student_id: string;
    turma_id?: string;
    description?: string;
    period: string; // YYYY-MM
    original_value: number;
    discount: number;
    interest: number;
    fine: number;
    final_value: number;
    paid_value: number;
    balance: number;
    due_date: string; // YYYY-MM-DD
    promise_date?: string;
    status: 'PAID' | 'PARTIAL' | 'OPEN' | 'OVERDUE' | 'NEGOTIATED' | 'CANCELLED';
    synced?: number;
    payments?: ReceivablePaymentRecord[];
    history?: ReceivableHistoryRecord[];
}

export interface ReceivablePaymentRecord {
    id: string;
    organization_id: string;
    receivable_id: string;
    amount: number;
    method: string;
    paid_at: string;
    notes?: string;
    created_by?: string;
    synced?: number;
}

export interface ReceivableHistoryRecord {
    id: string;
    organization_id: string;
    receivable_id: string;
    action: string;
    old_value?: string;
    new_value?: string;
    created_by?: string;
    synced?: number;
}

export class ReceivableRepository {
    async getAll(params: { page: number; per_page: number; status?: string; period?: string; student_id?: string }) {
        const db = await getDb()
        if (!db) {
            let url = `/receivables?page=${params.page}&per_page=${params.per_page}`
            if (params.status) url += `&status=${params.status}`
            if (params.period) url += `&period=${params.period}`
            if (params.student_id) url += `&student_id=${params.student_id}`
            return await http<any>(url)
        }

        let query = 'SELECT * FROM receivables'
        const queryParams: any[] = []
        const conditions: string[] = []

        if (params.status) {
            conditions.push('status = ?')
            queryParams.push(params.status)
        }
        if (params.period) {
            conditions.push('period = ?')
            queryParams.push(params.period)
        }
        if (params.student_id) {
            conditions.push('student_id = ?')
            queryParams.push(params.student_id)
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ')
        }

        query += ' ORDER BY due_date DESC LIMIT ? OFFSET ?'
        
        const countQuery = 'SELECT COUNT(*) as total FROM receivables' + (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '')
        
        queryParams.push(params.per_page, (params.page - 1) * params.per_page)

        const data = await db.select<ReceivableRecord[]>(query, queryParams)
        
        const countParams = queryParams.slice(0, queryParams.length - 2) // Remove limit and offset
        const res = await db.select<any[]>(countQuery, countParams)
        const total = res[0]?.total || 0

        for (const rec of data) {
             const t = await db.select<ReceivablePaymentRecord[]>('SELECT * FROM receivable_payments WHERE receivable_id = ? ORDER BY paid_at DESC', [rec.id])
             rec.payments = t || []
             const h = await db.select<ReceivableHistoryRecord[]>('SELECT * FROM receivable_histories WHERE receivable_id = ? ORDER BY created_at DESC', [rec.id])
             rec.history = h || []
        }

        return {
            data,
            meta: { page: params.page, per_page: params.per_page, total, page_count: Math.ceil(total / params.per_page) }
        }
    }

    async generateAll(period?: string) {
        return http('/receivables/generate', {
            method: 'POST',
            body: JSON.stringify({ period })
        })
    }

    async getByStudent(studentId: string) {
        const db = await getDb();
        if (!db) {
            const res = await http<{ data: ReceivableRecord[] }>(`/receivables?student_id=${studentId}`);
            return res.data;
        }

        return db.select<ReceivableRecord[]>(
            'SELECT * FROM receivables WHERE student_id = ? ORDER BY due_date DESC',
            [studentId]
        );
    }

    async save(data: Omit<ReceivableRecord, 'id'> & { id?: string }) {
        const db = await getDb();
        const id = data.id || crypto.randomUUID();
        const isUpdate = !!data.id;

        if (db) {
            if (isUpdate) {
                await db.execute(
                    `UPDATE receivables SET 
                        description = ?, period = ?, 
                        original_value = ?, discount = ?, interest = ?, fine = ?, 
                        final_value = ?, paid_value = ?, balance = ?,
                        due_date = ?, promise_date = ?, status = ?, turma_id = ?,
                        synced = 0, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [
                        data.description || null, data.period, 
                        data.original_value, data.discount || 0, data.interest || 0, data.fine || 0,
                        data.final_value, data.paid_value || 0, data.balance,
                        data.due_date, data.promise_date || null, data.status, data.turma_id || null, id
                    ]
                );
                await syncService.addToQueue('receivables', id, 'UPDATE', data);
            } else {
                await db.execute(
                    `INSERT INTO receivables (
                        id, organization_id, student_id, turma_id, description, period, 
                        original_value, discount, interest, fine, 
                        final_value, paid_value, balance,
                        due_date, promise_date, status, synced
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                    [
                        id, data.organization_id, data.student_id, data.turma_id || null, data.description || null, data.period,
                        data.original_value, data.discount || 0, data.interest || 0, data.fine || 0,
                        data.final_value, data.paid_value || 0, data.balance,
                        data.due_date, data.promise_date || null, data.status
                    ]
                );
                await syncService.addToQueue('receivables', id, 'CREATE', data);
            }
        }
        return { ...data, id };
    }

    async delete(id: string) {
        const db = await getDb();
        if (db) {
             await db.execute('DELETE FROM receivables WHERE id = ?', [id]);
             await syncService.addToQueue('receivables', id, 'DELETE', {});
        } else {
             await http(`/receivables/${id}`, { method: 'DELETE' });
        }
    }

    async savePayment(data: Omit<ReceivablePaymentRecord, 'id'>) {
        const db = await getDb();
        if (!db) {
            await http('/receivables/payments', { method: 'POST', body: JSON.stringify(data) })
            return
        }

        const id = crypto.randomUUID()
        await db.execute(
            `INSERT INTO receivable_payments (
                id, organization_id, receivable_id, amount, method, paid_at, notes, created_by, synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                id, data.organization_id, data.receivable_id, data.amount, data.method, data.paid_at, data.notes || null, data.created_by || null
            ]
        )
        // sync
        await syncService.addToQueue('receivable_payments', id, 'CREATE', data);
        return id
    }

    async deletePayment(id: string) {
         const db = await getDb()
         if (db) {
              await db.execute('DELETE FROM receivable_payments WHERE id = ?', [id])
              await syncService.addToQueue('receivable_payments', id, 'DELETE', {})
         } else {
              await http(`/receivables/payments/${id}`, { method: 'DELETE' })
         }
    }

    async saveHistory(data: Omit<ReceivableHistoryRecord, 'id'>) {
        const db = await getDb();
        if (!db) {
            await http('/receivables/history', { method: 'POST', body: JSON.stringify(data) })
            return
        }

        const id = crypto.randomUUID()
        await db.execute(
            `INSERT INTO receivable_histories (
                id, organization_id, receivable_id, action, old_value, new_value, created_by, synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                id, data.organization_id, data.receivable_id, data.action, data.old_value || null, data.new_value || null, data.created_by || null
            ]
        )
        await syncService.addToQueue('receivable_histories', id, 'CREATE', data);
        return id
    }
}

export const receivableRepository = new ReceivableRepository();
