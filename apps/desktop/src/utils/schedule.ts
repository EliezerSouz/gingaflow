
export type ScheduleItem = {
  day: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  time: string // "HH:mm"
}

export type Schedule = ScheduleItem[]

const DAYS_MAP = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function parseSchedule(scheduleString: string | null | undefined | any): Schedule {
  if (!scheduleString) return []
  
  // If it's already an object/array (unexpected but possible if coming from JSON field automatically parsed)
  if (typeof scheduleString === 'object') {
      if (Array.isArray(scheduleString)) {
          return scheduleString.filter(item => 
            typeof item.day === 'number' && 
            item.day >= 0 && 
            item.day <= 6 && 
            typeof item.time === 'string'
          )
      }
      return []
  }

  if (typeof scheduleString !== 'string') return []

  const trimmed = scheduleString.trim()
  try {
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        // Basic validation
        return parsed.filter(item => 
          typeof item.day === 'number' && 
          item.day >= 0 && 
          item.day <= 6 && 
          typeof item.time === 'string'
        )
      } else if (typeof parsed === 'object' && parsed !== null) {
          // Handle single object case
          if (typeof parsed.day === 'number' && typeof parsed.time === 'string') {
              return [parsed]
          }
      }
    }
  } catch (e) {
    // Ignore error, treat as legacy or empty
  }
  return []
}

export function isLegacySchedule(scheduleString: string | null | undefined | any): boolean {
  if (!scheduleString) return false
  if (typeof scheduleString !== 'string') return false // Objects are not legacy string format
  const trimmed = scheduleString.trim()
  // If it starts with [ or {, it's likely JSON, so not legacy text (unless parsing fails, but we assume JSON structure implies structured data)
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return false
  return trimmed.length > 0
}

export function formatSchedule(scheduleString: string | null | undefined): string {
  if (!scheduleString) return 'Sem horário'
  
  if (isLegacySchedule(scheduleString)) {
    return scheduleString // Return legacy text as is
  }

  const schedule = parseSchedule(scheduleString)
  if (schedule.length === 0) return 'Sem horário'

  // Sort by day and time
  schedule.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day
    return a.time.localeCompare(b.time)
  })

  // Group by time
  const timeGroups: Record<string, number[]> = {}
  schedule.forEach(item => {
    if (!timeGroups[item.time]) {
      timeGroups[item.time] = []
    }
    timeGroups[item.time].push(item.day)
  })

  // Format
  return Object.entries(timeGroups)
    .map(([time, days]) => {
      const dayNames = days.map(d => DAYS_MAP[d]).join('/')
      return `${dayNames} ${time}`
    })
    .join(', ')
}

export function stringifySchedule(schedule: Schedule): string {
  return JSON.stringify(schedule)
}
