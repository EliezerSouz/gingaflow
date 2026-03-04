import { http } from './http'

export type FinancialReport = {
    monthlyRevenue: number[]
    overdue: {
        count: number
        value: number
    }
    forecast: {
        value: number
    }
}

export type AcademicReport = {
    byStatus: { status: string; count: number }[]
    byGraduation: { name: string; count: number }[]
}

export async function getFinancialReport() {
    return http<FinancialReport>('/reports/financial')
}

export async function getAcademicReport() {
    return http<AcademicReport>('/reports/academic')
}
