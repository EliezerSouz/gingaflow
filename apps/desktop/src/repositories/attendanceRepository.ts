import { getDb } from '../lib/db';
import { syncService } from '../services/SyncService';
import { http } from '../services/http';

export interface AttendanceRecord {
    id: string;
    organization_id: string;
    student_id: string;
    turma_id: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED';
    notes?: string;
    synced?: number;
}

export class AttendanceRepository {
    async getByTurmaAndDate(turmaId: string, date: string) {
        const db = await getDb();
        if (!db) {
            const res = await http<{ data: AttendanceRecord[] }>(`/attendance?turmaId=${turmaId}&date=${date}`);
            return res.data;
        }

        return db.select<AttendanceRecord[]>(
            'SELECT * FROM attendance WHERE turma_id = ? AND date = ?',
            [turmaId, date]
        );
    }

    async save(data: Omit<AttendanceRecord, 'id' | 'organization_id'> & { organization_id: string }) {
        const db = await getDb();
        const id = crypto.randomUUID();

        if (db) {
            // Check if record exists for this student/turma/date
            const existing = await db.select<AttendanceRecord[]>(
                'SELECT id FROM attendance WHERE student_id = ? AND turma_id = ? AND date = ?',
                [data.student_id, data.turma_id, data.date]
            );

            if (existing.length > 0) {
                const recordId = existing[0].id;
                await db.execute(
                    'UPDATE attendance SET status = ?, notes = ?, synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [data.status, data.notes || null, recordId]
                );
                await syncService.addToQueue('attendance', recordId, 'UPDATE', { ...data, id: recordId });
            } else {
                await db.execute(
                    `INSERT INTO attendance (id, organization_id, student_id, turma_id, date, status, notes, synced) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                    [id, data.organization_id, data.student_id, data.turma_id, data.date, data.status, data.notes || null]
                );
                await syncService.addToQueue('attendance', id, 'CREATE', { ...data, id });
            }
        } else {
            // Fallback direct sync
            await http('/attendance', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    }
}

export const attendanceRepository = new AttendanceRepository();
