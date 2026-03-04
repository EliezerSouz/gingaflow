import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getSettings, updateSettings as apiUpdateSettings, SystemSettings } from '../services/settings'
import { useAuth } from './AuthContext'

type SettingsContextType = {
  settings: SystemSettings
  refreshSettings: () => Promise<void>
  updateSettings: (data: Partial<SystemSettings>) => Promise<void>
}

const defaultSettings: SystemSettings = {
  groupName: '',
  logoUrl: '',
  themeColor: 'blue'
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  refreshSettings: async () => {},
  updateSettings: async () => {}
})

export function useSettings() {
  return useContext(SettingsContext)
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const { auth } = useAuth()

  const refreshSettings = async () => {
    try {
      const data = await getSettings()
      setSettings(data)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const updateSettings = async (data: Partial<SystemSettings>) => {
    try {
      const updated = await apiUpdateSettings(data)
      setSettings(updated)
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }

  useEffect(() => {
    if (auth.token) {
      refreshSettings()
    }
  }, [auth.token])

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
