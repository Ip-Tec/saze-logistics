// app/web/app/(root)/admin/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@shared/supabaseClient'
import type { Database } from '@shared/supabase/types'
import ActionButton from '@/components/admin/people/ActionButton'
import { toast, ToastContainer } from 'react-toastify'

type ConfigRow = Database['public']['Tables']['config']['Row']

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  // Fetch config from Supabase
  const fetchConfigs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .order('key')
    if (error) {
      console.error('Error loading configs:', error.message)
      toast.error('Failed to load settings')
    } else {
      setConfigs(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const handleSave = async (key: string, newValue: string) => {
    setSavingKey(key)
    const { error } = await supabase
      .from('config')
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq('key', key)
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      setConfigs((prev) =>
        prev.map((c) =>
          c.key === key ? { ...c, value: newValue, updated_at: new Date().toISOString() } : c
        )
      )
      toast.success('Setting saved successfully')
    }
    setSavingKey(null)
  }

  if (loading) return <div className="p-4 text-gray-600">Loading settings…</div>

  // Group configs by categories
  const groupedConfigs = configs.reduce((acc, config) => {
    const group = config.key.startsWith('notify_') ? 'Notifications'
      : config.key.includes('commission') || config.key.includes('withdrawal') ? 'Finance'
      : config.key.includes('terms') || config.key.includes('privacy') ? 'Legal'
      : 'General'
    acc[group] = acc[group] || []
    acc[group].push(config)
    return acc
  }, {} as Record<string, ConfigRow[]>)

  return (
    <div className="p-4 space-y-6">
      <ToastContainer />
      <h1 className="text-2xl font-semibold">Settings &amp; Configuration</h1>

      {Object.entries(groupedConfigs).map(([groupName, items]) => (
        <div key={groupName}>
          <h2 className="text-xl font-semibold mt-6 mb-2">{groupName} Settings</h2>
          <div className="space-y-4 max-w-xl">
            {items.map((cfg) => {
              // Determine input type
              let inputElem
              if (cfg.type === 'boolean') {
                inputElem = (
                  <input
                    type="checkbox"
                    checked={cfg.value === 'true'}
                    onChange={(e) =>
                      handleSave(cfg.key, e.target.checked ? 'true' : 'false')
                    }
                    disabled={savingKey === cfg.key}
                    className="h-5 w-5"
                  />
                )
              } else if (cfg.type === 'number') {
                inputElem = (
                  <input
                    type="number"
                    value={cfg.value}
                    onChange={(e) => handleSave(cfg.key, e.target.value)}
                    disabled={savingKey === cfg.key}
                    className="border px-2 py-1 w-28 rounded"
                  />
                )
              } else if (cfg.type === 'json') {
                inputElem = (
                  <textarea
                    rows={2}
                    value={cfg.value}
                    onChange={(e) => handleSave(cfg.key, e.target.value)}
                    disabled={savingKey === cfg.key}
                    className="border px-2 py-1 w-full font-mono text-sm rounded"
                  />
                )
              } else {
                inputElem = (
                  <input
                    type="text"
                    value={cfg.value}
                    onChange={(e) => handleSave(cfg.key, e.target.value)}
                    disabled={savingKey === cfg.key}
                    className="border px-2 py-1 w-full rounded"
                  />
                )
              }

              return (
                <div key={cfg.key} className="flex items-start space-x-4">
                  <label className="flex-1">
                    <div className="font-medium">{cfg.label}</div>
                    <div className="text-gray-500 text-xs">({cfg.key})</div>
                    {cfg.updated_at && (
                      <div className="text-[11px] text-gray-400 mt-1">
                        Last updated: {new Date(cfg.updated_at).toLocaleString()}
                      </div>
                    )}
                  </label>
                  <div className="flex flex-col items-start space-y-1">
                    {inputElem}
                    {cfg.type !== 'boolean' && (
                      <ActionButton
                        label={savingKey === cfg.key ? 'Saving…' : 'Save'}
                        onClick={() => handleSave(cfg.key, cfg.value)}
                        colorClass="bg-blue-600 text-white"
                        disabled={savingKey !== null && savingKey !== cfg.key}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
