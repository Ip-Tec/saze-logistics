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

  // Fetch all config entries
  const fetchConfigs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .order('key')
    if (error) console.error('Error loading configs:', error.message)
    else setConfigs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  // Handle a single setting update
  const handleSave = async (key: string, newValue: string) => {
    setSavingKey(key)
    const { error } = await supabase
      .from('config')
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq('key', key)
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      // update local state
      setConfigs((prev) =>
        prev.map((c) =>
          c.key === key ? { ...c, value: newValue, updated_at: new Date().toISOString() } : c
        )
      )
    }
    setSavingKey(null)
  }

  if (loading) return <div className="p-4 text-gray-600">Loading settings…</div>

  return (
    <div className="p-4 space-y-6">
        <ToastContainer />
      <h1 className="text-2xl font-semibold">Settings &amp; Configuration</h1>

      <div className="space-y-4 max-w-xl">
        {configs.map((cfg) => {
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
                className="border px-2 py-1 w-24"
              />
            )
          } else if (cfg.type === 'json') {
            inputElem = (
              <textarea
                rows={2}
                value={cfg.value}
                onChange={(e) => handleSave(cfg.key, e.target.value)}
                disabled={savingKey === cfg.key}
                className="border px-2 py-1 w-full font-mono text-sm"
              />
            )
          } else {
            // string
            inputElem = (
              <input
                type="text"
                value={cfg.value}
                onChange={(e) => handleSave(cfg.key, e.target.value)}
                disabled={savingKey === cfg.key}
                className="border px-2 py-1 w-full"
              />
            )
          }

          return (
            <div key={cfg.key} className="flex items-center space-x-4">
              <label className="flex-1">
                <div className="font-medium">{cfg.label}</div>
                <div className="text-gray-500 text-xs">({cfg.key})</div>
              </label>
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
          )
        })}
      </div>
    </div>
  )
}
