
import React from 'react'
import { parseSchedule, stringifySchedule, ScheduleItem, isLegacySchedule } from '../utils/schedule'

const DAYS = [
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' }
]

export function ScheduleInput({ value, onChange }: { value: string | undefined, onChange: (val: string) => void }) {
  const isLegacy = isLegacySchedule(value)

  function clearLegacy() {
    onChange(stringifySchedule([]))
  }

  if (isLegacy) {
    return (
      <div className="p-4 border rounded bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-800 mb-2">
          Horário em formato antigo: <strong>{value}</strong>
        </p>
        <button 
          type="button"
          onClick={clearLegacy}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Atualizar para novo formato
        </button>
      </div>
    )
  }

  const items = parseSchedule(value)
  const scheduleMap = items.reduce((acc, item) => {
    acc[item.day] = item.time
    return acc
  }, {} as Record<number, string>)

  function handleCheck(day: number, checked: boolean) {
    let newItems = [...items]
    if (checked) {
      if (scheduleMap[day] === undefined) {
        newItems.push({ day, time: '' })
      }
    } else {
      newItems = newItems.filter(i => i.day !== day)
    }
    onChange(stringifySchedule(newItems))
  }

  function handleTimeChange(day: number, time: string) {
    const newItems = items.map(i => i.day === day ? { ...i, time } : i)
    onChange(stringifySchedule(newItems))
  }

  return (
    <div className="space-y-2 border rounded-md p-3 bg-gray-50">
      {DAYS.map(day => {
        const isChecked = scheduleMap[day.id] !== undefined
        const time = scheduleMap[day.id] || ''

        return (
          <div key={day.id} className="flex items-center gap-3 h-9">
            <label className="flex items-center gap-2 min-w-[100px] cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 transition-colors cursor-pointer"
                checked={isChecked}
                onChange={e => handleCheck(day.id, e.target.checked)}
              />
              <span className={`text-sm ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {day.label}
              </span>
            </label>
            
            {isChecked && (
              <input
                type="time"
                value={time}
                onChange={e => handleTimeChange(day.id, e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 w-32 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white shadow-sm"
              />
            )}
          </div>
        )
      })}
      <div className="text-xs text-gray-500 pt-2 border-t mt-2">
        Selecione os dias da semana e defina o horário de início das aulas.
      </div>
    </div>
  )
}
