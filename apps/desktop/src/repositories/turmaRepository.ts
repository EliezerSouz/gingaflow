import { Turma } from '../services/units'
import { getDb } from '../lib/db'
import { listUnitTurmas, createTurma, updateTurma } from '../services/units'

export class TurmaRepository {
    async getByUnit(unitId: string) {
        const db = await getDb();
        if (!db) {
            const remote = await listUnitTurmas(unitId);
            return remote.data;
        }

        const results = await db.select<any[]>('SELECT * FROM turmas WHERE unit_id = ? ORDER BY name ASC', [unitId]);
        
        if (results.length === 0) {
            const remote = await listUnitTurmas(unitId);
            for (const t of remote.data) {
                await db.execute(
                    `INSERT OR REPLACE INTO turmas (id, unit_id, name, schedule, status, default_monthly_fee_cents, default_payment_method, synced) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                    [t.id, t.unitId, t.name, t.schedule, t.status, t.defaultMonthlyFeeCents, t.defaultPaymentMethod]
                );
            }
            return remote.data;
        }
        
        return results.map((r: any) => ({
            ...r,
            unitId: r.unit_id,
            defaultMonthlyFeeCents: r.default_monthly_fee_cents,
            defaultPaymentMethod: r.default_payment_method
        }));
    }

    async save(data: Omit<Turma, 'id'> & { id?: string }) {
        const db = await getDb();
        if (!db) {
            if (data.id) return updateTurma(data.id, data);
            return createTurma(data);
        }

        const id = data.id || crypto.randomUUID();
        const isUpdate = !!data.id;
        
        if (isUpdate) {
            await db.execute(
                `UPDATE turmas SET unit_id = ?, name = ?, schedule = ?, status = ?, default_monthly_fee_cents = ?, default_payment_method = ?, synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [data.unitId, data.name, data.schedule, data.status, data.defaultMonthlyFeeCents, data.defaultPaymentMethod, id]
            );
        } else {
            await db.execute(
                `INSERT INTO turmas (id, unit_id, name, schedule, status, default_monthly_fee_cents, default_payment_method, synced) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                [id, data.unitId, data.name, data.schedule, data.status, data.defaultMonthlyFeeCents, data.defaultPaymentMethod]
            );
        }

        await db.execute(
            'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
            ['turmas', id, isUpdate ? 'UPDATE' : 'CREATE', JSON.stringify(data)]
        );

        this.triggerSync().catch(console.error);
        return { ...data, id };
    }

    async triggerSync() {
        const db = await getDb();
        if (!db) return;
        const queue = await db.select<any[]>('SELECT * FROM sync_queue WHERE table_name = "turmas" ORDER BY created_at ASC');
        
        for (const item of queue) {
            try {
                const payload = JSON.parse(item.payload);
                if (item.operation === 'CREATE') {
                    await createTurma(payload);
                    await db.execute('UPDATE turmas SET synced = 1 WHERE id = ?', [item.record_id]);
                    await db.execute('DELETE FROM sync_queue WHERE id = ?', [item.id]);
                } else if (item.operation === 'UPDATE') {
                    await updateTurma(item.record_id, payload);
                    await db.execute('UPDATE turmas SET synced = 1 WHERE id = ?', [item.record_id]);
                    await db.execute('DELETE FROM sync_queue WHERE id = ?', [item.id]);
                }
            } catch (err) {
                console.warn('Sync failed for turma', item.id, err);
            }
        }
    }
}

export const turmaRepository = new TurmaRepository();
