import { getDb } from '../lib/db';
import { syncService } from '../services/SyncService';
import { getSettings, updateSettings as apiUpdateSettings, SystemSettings } from '../services/settings';

export class SystemSettingsRepository {
    async get() {
        const db = await getDb();
        if (!db) {
            return getSettings();
        }

        const results = await db.select<any[]>('SELECT * FROM app_settings LIMIT 1');
        
        if (results.length === 0) {
            const remote = await getSettings();
            await db.execute(
                `INSERT INTO app_settings (id, organization_id, group_name, logo_url, theme_color) 
                 VALUES (?, ?, ?, ?, ?)`,
                [crypto.randomUUID(), (remote as any).organizationId || '', remote.groupName, remote.logoUrl, remote.themeColor]
            );
            return remote;
        }
        
        const row = results[0];
        return {
            organizationId: row.organization_id,
            groupName: row.group_name,
            logoUrl: row.logo_url,
            themeColor: row.theme_color
        } as SystemSettings;
    }

    async update(data: Partial<SystemSettings>) {
        const db = await getDb();
        if (!db) {
            return apiUpdateSettings(data);
        }

        const current = await this.get();
        const updated = { ...current, ...data };

        await db.execute(
            `UPDATE app_settings SET 
                group_name = ?, logo_url = ?, theme_color = ?`,
            [updated.groupName, updated.logoUrl, updated.themeColor]
        );

        // Track organizationId for sync
        const results = await db.select<any[]>('SELECT organization_id FROM app_settings LIMIT 1');
        const orgId = results[0]?.organization_id;

        await syncService.addToQueue('app_settings', orgId || 'config', 'UPDATE', updated);
        
        return updated;
    }
}

export const systemSettingsRepository = new SystemSettingsRepository();
