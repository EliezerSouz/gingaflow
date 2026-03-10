import { getDb } from '../lib/db';
import { syncService } from '../services/SyncService';
import { http } from '../services/http';

export interface PaymentRecord {
    id: string;
    organization_id: string;
    student_id: string;
    monthly_fee_cents: number;
    due_day: number;
    period: string; // YYYY-MM
    status: 'PAGO' | 'EM_ABERTO' | 'ATRASADO';
    paid_at?: string;
    method?: string;
    notes?: string;
    synced?: number;
}

export class PaymentRepository {
    async getByStudent(studentId: string) {
        const db = await getDb();
        if (!db) {
            const res = await http<{ data: PaymentRecord[] }>(`/payments?studentId=${studentId}`);
            return res.data;
        }

        return db.select<PaymentRecord[]>(
            'SELECT * FROM payments WHERE student_id = ? ORDER BY period DESC',
            [studentId]
        );
    }

    async save(data: Omit<PaymentRecord, 'id'> & { id?: string }) {
        const db = await getDb();
        const id = data.id || crypto.randomUUID();
        const isUpdate = !!data.id;

        if (db) {
            if (isUpdate) {
                await db.execute(
                    `UPDATE payments SET 
                        status = ?, paid_at = ?, method = ?, notes = ?, 
                        synced = 0, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [data.status, data.paid_at || null, data.method || null, data.notes || null, id]
                );
                await syncService.addToQueue('payments', id, 'UPDATE', data);
            } else {
                await db.execute(
                    `INSERT INTO payments (
                        id, organization_id, student_id, monthly_fee_cents, 
                        due_day, period, status, paid_at, method, notes, synced
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                    [
                        id, data.organization_id, data.student_id, data.monthly_fee_cents, 
                        data.due_day, data.period, data.status, 
                        data.paid_at || null, data.method || null, data.notes || null
                    ]
                );
                await syncService.addToQueue('payments', id, 'CREATE', { ...data, id });
            }
        } else {
            const method = isUpdate ? 'PUT' : 'POST';
            const url = isUpdate ? `/payments/${id}` : '/payments';
            await http(url, {
                method,
                body: JSON.stringify(data)
            });
        }
        
        return { ...data, id };
    }

    async delete(id: string) {
        const db = await getDb();
        if (!db) {
            await http(`/payments/${id}`, { method: 'DELETE' });
            return;
        }

        await db.execute('DELETE FROM payments WHERE id = ?', [id]);
        await syncService.addToQueue('payments', id, 'DELETE', null);
    }
}

export const paymentRepository = new PaymentRepository();
