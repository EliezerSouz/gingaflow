export function formatSchedule(schedule: string) {
    try {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const parsed = JSON.parse(schedule);
        if (Array.isArray(parsed)) {
            return parsed.map((item: any) => `${days[item.day]} às ${item.time}`).join('\n');
        }
        return schedule;
    } catch {
        return schedule;
    }
}
