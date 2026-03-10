import { http } from './http'

export interface DashboardData {
    summary: {
        presences: number;
        classesCount: number;
        revenueToday: number;
        overdueCount: number;
    };
    status: {
        activeStudents: number;
        activeTeachers: number;
        unitsCount: number;
        turmasCount: number;
    };
    classesToday: Array<{
        id: string;
        turmaId: string;
        name: string;
        time: string;
        durationMinutes: number;
        teacher: string;
        count: number;
        enrolledCount: number;
        status: 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA';
        unitName: string;
        unitColor: string;
    }>;
    alerts: Array<{ type: 'danger' | 'warning' | 'info'; message: string; icon: string }>;
}

export async function getDashboardOverview(unitId?: string) {
    try {
        const query = unitId ? `?unitId=${unitId}` : '';
        const data = await http<DashboardData>(`/dashboard/overview${query}`);
        // Cache this for offline use
        localStorage.setItem(`dashboard_cache_${unitId || 'global'}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
        return data;
    } catch (err) {
        console.warn('Failed to fetch dashboard, trying cache...', err);
        const cached = localStorage.getItem(`dashboard_cache_${unitId || 'global'}`);
        if (cached) {
            return JSON.parse(cached).data as DashboardData;
        }
        throw err;
    }
}
