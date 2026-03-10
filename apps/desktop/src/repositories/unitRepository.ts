import { Unit } from '../services/units'
import { getDb } from '../lib/db'
import { listUnits, createUnit, updateUnit } from '../services/units'

export class UnitRepository {
    async getAll() {
        const db = await getDb();
        if (!db) {
            const remote = await listUnits();
            return remote.data;
        }

        const results = await db.select<any[]>('SELECT * FROM units ORDER BY name ASC');
        
        if (results.length === 0) {
            const remote = await listUnits();
            for (const u of remote.data) {
                await db.execute(
                    `INSERT OR REPLACE INTO units (id, name, address, color, status, default_monthly_fee_cents, default_payment_method, synced) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                    [u.id, u.name, u.address, u.color, u.status, u.defaultMonthlyFeeCents, u.defaultPaymentMethod]
                );
            }
            return remote.data;
        }
        
        return results.map((r: any) => ({
            ...r,
            defaultMonthlyFeeCents: r.default_monthly_fee_cents,
            defaultPaymentMethod: r.default_payment_method
        }));
    }

    async save(data: Omit<Unit, 'id'> & { id?: string }) {
        const db = await getDb();
        if (!db) {
            if (data.id) return updateUnit(data.id, data);
            return createUnit(data);
        }

        const id = data.id || crypto.randomUUID();
        const isUpdate = !!data.id;
        
        if (isUpdate) {
            await db.execute(
                `UPDATE units SET name = ?, address = ?, color = ?, status = ?, default_monthly_fee_cents = ?, default_payment_method = ?, synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [data.name, data.address, data.color, data.status, data.defaultMonthlyFeeCents, data.defaultPaymentMethod, id]
            );
        } else {
            await db.execute(
                `INSERT INTO units (id, name, address, color, status, default_monthly_fee_cents, default_payment_method, synced) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                [id, data.name, data.address, data.color, data.status, data.defaultMonthlyFeeCents, data.defaultPaymentMethod]
            );
        }

        await db.execute(
            'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
            ['units', id, isUpdate ? 'UPDATE' : 'CREATE', JSON.stringify(data)]
        );

        this.triggerSync().catch(console.error);
        return { ...data, id };
    }

    async triggerSync() {
        const db = await getDb();
        if (!db) return;
        const queue = await db.select<any[]>('SELECT * FROM sync_queue WHERE table_name = "units" ORDER BY created_at ASC');
        
        for (const item of queue) {
            try {
                const payload = JSON.parse(item.payload);
                if (item.operation === 'CREATE') {
                    await createUnit(payload);
                    await db.execute('UPDATE units SET synced = 1 WHERE id = ?', [item.record_id]);
                    await db.execute('DELETE FROM sync_queue WHERE id = ?', [item.id]);
                } else if (item.operation === 'UPDATE') {
                    await updateUnit(item.record_id, payload);
                    await db.execute('UPDATE units SET synced = 1 WHERE id = ?', [item.record_id]);
                    await db.execute('DELETE FROM sync_queue WHERE id = ?', [item.id]);
                }
            } catch (err) {
                console.warn('Sync failed for unit', item.id, err);
            }
        }
    }
}

export const unitRepository = new UnitRepository();
