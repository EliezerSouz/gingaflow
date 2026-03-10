import { Student as SharedStudent } from '@gingaflow/shared'
import { getDb } from '../lib/db'
import { getStudent, listStudents, createStudent, updateStudent } from '../services/students'

export class StudentRepository {
    async getAll(params: { q?: string; status?: string } = {}) {
        const db = await getDb();
        if (!db) {
            // Fallback to remote service if not in Tauri
            const remote = await listStudents(params);
            return remote.data;
        }

        let query = 'SELECT * FROM students';
        const queryParams: any[] = [];
        
        if (params.q || params.status) {
            query += ' WHERE ';
            const conditions: string[] = [];
            if (params.q) {
                conditions.push('(full_name LIKE ? OR nickname LIKE ? OR cpf LIKE ?)');
                queryParams.push(`%${params.q}%`, `%${params.q}%`, `%${params.q}%`);
            }
            if (params.status) {
                conditions.push('status = ?');
                queryParams.push(params.status);
            }
            query += conditions.join(' AND ');
        }
        
        query += ' ORDER BY full_name ASC';
        
        const results = await db.select<any[]>(query, queryParams);
        
        if (results.length === 0 && !params.q && !params.status) {
            // Initial load from remote ONLY if no filters were applied (to populate cache)
            const remote = await listStudents({});
            // Cache locally
            for (const s of remote.data) {
                await db.execute(
                    `INSERT OR REPLACE INTO students (id, full_name, nickname, cpf, birth_date, email, phone, enrollment_date, status, notes, synced) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [s.id, s.full_name, s.nickname, s.cpf, s.birth_date, s.email, s.phone, s.enrollment_date, s.status, s.notes]
                );
            }
            return remote.data;
        }
        
        return results;
    }

    async getById(id: string) {
        const db = await getDb();
        if (!db) return getStudent(id);

        const results = await db.select<any[]>('SELECT * FROM students WHERE id = ?', [id]);
        if (results.length > 0) return results[0];
        
        // Fallback to remote
        const remote = await getStudent(id);
        return remote;
    }

    async save(data: Omit<SharedStudent, 'id'> & { id?: string }) {
        const db = await getDb();
        if (!db) {
            if (data.id) return updateStudent(data.id, data as any);
            return createStudent(data as any);
        }

        const id = data.id || crypto.randomUUID();
        const isUpdate = !!data.id;
        
        // 1. Save local
        if (isUpdate) {
            await db.execute(
                `UPDATE students SET full_name = ?, nickname = ?, cpf = ?, birth_date = ?, email = ?, phone = ?, enrollment_date = ?, status = ?, notes = ?, synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [data.full_name, data.nickname, data.cpf, data.birth_date, data.email, data.phone, data.enrollment_date, data.status, data.notes, id]
            );
        } else {
            await db.execute(
                `INSERT INTO students (id, full_name, nickname, cpf, birth_date, email, phone, enrollment_date, status, notes, synced) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                [id, data.full_name, data.nickname, data.cpf, data.birth_date, data.email, data.phone, data.enrollment_date, data.status, data.notes]
            );
        }

        // 2. Add to sync queue
        await db.execute(
            'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
            ['students', id, isUpdate ? 'UPDATE' : 'CREATE', JSON.stringify(data)]
        );

        // Try background sync, but don't wait for it
        this.triggerSync().catch(console.error);

        return { ...data, id };
    }

    async delete(id: string) {
        const db = await getDb();
        if (!db) {
            // For now, remote delete is not implemented in service but we could add it
            // return deleteStudent(id);
            return;
        }
        
        // 1. Delete local (or mark as deleted if we want soft delete)
        await db.execute('DELETE FROM students WHERE id = ?', [id]);

        // 2. Add to sync queue
        await db.execute(
            'INSERT INTO sync_queue (table_name, record_id, operation) VALUES (?, ?, ?)',
            ['students', id, 'DELETE']
        );

        this.triggerSync().catch(console.error);
    }

    async triggerSync() {
        const db = await getDb();
        if (!db) return;

        const queue = await db.select<any[]>('SELECT * FROM sync_queue ORDER BY created_at ASC');
        
        for (const item of queue) {
            try {
                if (item.operation === 'CREATE') {
                    const payload = JSON.parse(item.payload);
                    await createStudent(payload);
                    await db.execute('UPDATE students SET synced = 1 WHERE id = ?', [item.record_id]);
                    await db.execute('DELETE FROM sync_queue WHERE id = ?', [item.id]);
                } else if (item.operation === 'UPDATE') {
                    const payload = JSON.parse(item.payload);
                    await updateStudent(item.record_id, payload);
                    await db.execute('UPDATE students SET synced = 1 WHERE id = ?', [item.record_id]);
                    await db.execute('DELETE FROM sync_queue WHERE id = ?', [item.id]);
                } else if (item.operation === 'DELETE') {
                    // (Implement remote delete if available in service)
                    // await deleteStudent(item.record_id);
                    await db.execute('DELETE FROM sync_queue WHERE id = ?', [item.id]);
                }
            } catch (err) {
                console.warn('Sync failed for item', item.id, err);
                // Keep in queue for next time
            }
        }
    }
}

export const studentRepository = new StudentRepository();
