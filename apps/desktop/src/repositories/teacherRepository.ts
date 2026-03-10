import { getDb } from '../lib/db'
import { listTeachers } from '../services/teachers'
import { syncService } from '../services/SyncService'

export class TeacherRepository {
    async getAll() {
        const db = await getDb();
        if (!db) {
            const remote = await listTeachers();
            return remote.data;
        }

        const results = await db.select<any[]>('SELECT * FROM teachers ORDER BY full_name ASC');
        
        if (results.length === 0) {
            const remote = await listTeachers();
            for (const t of remote.data) {
                await db.execute(
                    `INSERT OR REPLACE INTO teachers (id, organization_id, full_name, nickname, cpf, email, phone, graduation, status, notes, synced) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [t.id, (t as any).organizationId || (t as any).organization_id, t.full_name, t.nickname, t.cpf, t.email, t.phone, t.graduation, t.status, t.notes]
                );
            }
            return remote.data;
        }
        
        return results;
    }

    async getById(id: string) {
        const db = await getDb();
        if (!db) return null; // Should handle remote fallback if needed

        const results = await db.select<any[]>('SELECT * FROM teachers WHERE id = ?', [id]);
        return results[0] || null;
    }

    async save(data: any) {
        const db = await getDb();
        const id = data.id || crypto.randomUUID();
        const isUpdate = !!data.id;

        if (db) {
            if (isUpdate) {
                await db.execute(
                    `UPDATE teachers SET 
                        full_name = ?, nickname = ?, cpf = ?, email = ?, 
                        phone = ?, graduation = ?, status = ?, notes = ?, 
                        synced = 0, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [data.full_name, data.nickname, data.cpf, data.email, data.phone, data.graduation, data.status, data.notes, id]
                );
                await syncService.addToQueue('teachers', id, 'UPDATE', data);
            } else {
                await db.execute(
                    `INSERT INTO teachers (
                        id, organization_id, full_name, nickname, cpf, 
                        email, phone, graduation, status, notes, synced
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                    [id, data.organization_id, data.full_name, data.nickname, data.cpf, data.email, data.phone, data.graduation, data.status, data.notes]
                );
                await syncService.addToQueue('teachers', id, 'CREATE', { ...data, id });
            }
        } else {
            // No direct sync implementation here for now as per studentRepo pattern
        }

        return { ...data, id };
    }
}

export const teacherRepository = new TeacherRepository();
