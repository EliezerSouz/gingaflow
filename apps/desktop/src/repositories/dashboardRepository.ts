import { getDb } from '../lib/db';
import { getDashboardOverview, DashboardData } from '../services/dashboard';

export interface DashboardMetrics {
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
    finance: {
        monthlyRevenue: number;
        overdueValue: number;
        ticketAverage: number;
    };
    classesToday: any[];
    alerts: any[];
}

export class DashboardRepository {
    async getOverview(unitId?: string): Promise<DashboardData> {
        const db = await getDb();
        if (!db) {
            return getDashboardOverview(unitId);
        }

        // Calculate metrics from local database
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Active Students
        const studentsCount: any[] = await db.select(
            'SELECT COUNT(*) as count FROM students WHERE status = "ATIVO"'
        );
        
        // 2. Overdue Payments
        const overdueCount: any[] = await db.select(
            'SELECT COUNT(*) as count FROM payments WHERE status = "ATRASADO" OR (status = "EM_ABERTO" AND period < ?)',
            [today.slice(0, 7)]
        );

        // 3. Today's presences
        const presencesCount: any[] = await db.select(
            'SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = "PRESENT"',
            [today]
        );

        // 4. Units and Turmas
        const unitsCount: any[] = await db.select('SELECT COUNT(*) as count FROM units WHERE status = "ATIVO"');
        const turmasCount: any[] = await db.select('SELECT COUNT(*) as count FROM turmas WHERE status = "ATIVO"');
        const teachersCount: any[] = await db.select('SELECT COUNT(*) as count FROM teachers WHERE status = "ATIVO"');

        // 5. Revenue today
        const revenueToday: any[] = await db.select(
            'SELECT SUM(monthly_fee_cents) as sum FROM payments WHERE status = "PAGO" AND paid_at LIKE ?',
            [`${today}%`]
        );

        return {
            summary: {
                presences: presencesCount[0]?.count || 0,
                classesCount: 0, // Need logic to match schedule with weekday
                revenueToday: (revenueToday[0]?.sum || 0) / 100,
                overdueCount: overdueCount[0]?.count || 0
            },
            status: {
                activeStudents: studentsCount[0]?.count || 0,
                activeTeachers: teachersCount[0]?.count || 0,
                unitsCount: unitsCount[0]?.count || 0,
                turmasCount: turmasCount[0]?.count || 0
            },
            classesToday: [], // Need schedule logic
            alerts: []
        };
    }
}

export const dashboardRepository = new DashboardRepository();
