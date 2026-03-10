import { getDb } from '../lib/db';
import { http } from './http';

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncItem {
    id: number;
    table_name: string;
    record_id: string;
    operation: SyncOperation;
    payload: string;
}

class SyncService {
    private syncing = false;

    async triggerSync() {
        if (this.syncing) return;
        this.syncing = true;

        try {
            const db = await getDb();
            if (!db) return;

            // 1. Push local changes to remote
            await this.pushLocalChanges(db);

            // 2. Pull remote changes to local (optional for now, or per entity)
            // await this.pullRemoteChanges(db);
            
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            this.syncing = false;
        }
    }

    private async pushLocalChanges(db: any) {
        const queue: SyncItem[] = await db.select('SELECT * FROM sync_queue ORDER BY created_at ASC');
        
        for (const item of queue) {
            try {
                const payload = JSON.parse(item.payload);
                const endpoint = `/${item.table_name.replace('_', '-')}`;
                
                let success = false;
                if (item.operation === 'CREATE') {
                    await http(endpoint, { method: 'POST', body: JSON.stringify(payload) });
                    success = true;
                } else if (item.operation === 'UPDATE') {
                    await http(`${endpoint}/${item.record_id}`, { method: 'PUT', body: JSON.stringify(payload) });
                    success = true;
                } else if (item.operation === 'DELETE') {
                    await http(`${endpoint}/${item.record_id}`, { method: 'DELETE' });
                    success = true;
                }

                if (success) {
                    await db.execute('DELETE FROM sync_queue WHERE id = ?', [item.id]);
                    // Update synced status in the original table
                    await db.execute(`UPDATE ${item.table_name} SET synced = 1 WHERE id = ?`, [item.record_id]);
                }
            } catch (error) {
                console.error(`Failed to sync item ${item.id}:`, error);
                // Stop processing the queue if a prerequisite fails or wait for next run?
                // For now, continue to next item if it's unrelated, or stop if it's a critical error.
                break; 
            }
        }
    }

    async addToQueue(tableName: string, recordId: string, operation: SyncOperation, payload: any) {
        const db = await getDb();
        if (!db) return;

        await db.execute(
            'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
            [tableName, recordId, operation, JSON.stringify(payload)]
        );
        
        // Try to sync immediately if online
        this.triggerSync();
    }
}

export const syncService = new SyncService();
