'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type RoutingConfig = {
  id: string
  topic: string
  owner_email: string
  backup_email: string | null
  slack_webhook_url: string | null
  preferred_channel: string
  escalation_hours: number
}

const TOPIC_LABEL: Record<string, string> = {
  security_compliance: 'Security & Compliance',
  legal: 'Legal',
  pricing: 'Pricing',
  technical: 'Technical',
  commercial: 'Commercial',
  implementation: 'Implementation',
  support: 'Support',
  general: 'General',
}

const CHANNEL_STYLES: Record<string, string> = {
  email: 'bg-blue-50 text-blue-700',
  slack: 'bg-purple-50 text-purple-700',
  both: 'bg-green-50 text-green-700',
}

type EditState = Partial<RoutingConfig>

export function RoutingConfigTable() {
  const [configs, setConfigs] = useState<RoutingConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({})
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/admin/routing')
      const data = await res.json()
      if (Array.isArray(data)) setConfigs(data)
      else setError(data.error ?? 'Failed to load')
    } catch {
      setError('Failed to load routing config')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function startEdit(cfg: RoutingConfig) {
    setEditingId(cfg.id)
    setEditState({
      owner_email: cfg.owner_email,
      backup_email: cfg.backup_email ?? '',
      slack_webhook_url: cfg.slack_webhook_url ?? '',
      preferred_channel: cfg.preferred_channel,
      escalation_hours: cfg.escalation_hours,
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const payload = {
        ...editState,
        backup_email: editState.backup_email || null,
        slack_webhook_url: editState.slack_webhook_url || null,
      }
      const res = await fetch(`/api/admin/routing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setConfigs((prev) => prev.map((c) => (c.id === id ? data : c)))
      setEditingId(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Channel</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Escalation</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {configs.map((cfg) =>
            editingId === cfg.id ? (
              <tr key={cfg.id} className="bg-blue-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">
                  {TOPIC_LABEL[cfg.topic] ?? cfg.topic}
                </td>
                <td className="px-4 py-2.5">
                  <input
                    value={editState.owner_email ?? ''}
                    onChange={(e) => setEditState((s) => ({ ...s, owner_email: e.target.value }))}
                    placeholder="owner@company.com"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={editState.preferred_channel ?? 'email'}
                    onChange={(e) => setEditState((s) => ({ ...s, preferred_channel: e.target.value }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="both">Both</option>
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    value={editState.escalation_hours ?? 48}
                    onChange={(e) => setEditState((s) => ({ ...s, escalation_hours: Number(e.target.value) }))}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="ml-1 text-xs text-gray-500">h</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => saveEdit(cfg.id)}
                      disabled={saving}
                      className="text-xs text-green-700 hover:text-green-900 font-medium disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={cfg.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-gray-900">
                  {TOPIC_LABEL[cfg.topic] ?? cfg.topic}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {cfg.owner_email || <span className="text-gray-300 italic">unset</span>}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      CHANNEL_STYLES[cfg.preferred_channel] ?? 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {cfg.preferred_channel}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{cfg.escalation_hours}h</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => startEdit(cfg)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}
