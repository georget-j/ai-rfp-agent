'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Integration = {
  platform: 'resend' | 'slack'
  settings: Record<string, unknown>
  is_active: boolean
  updated_at: string
}

type SlackPreview = {
  topic: string
  question: string
  summary: string
  confidence: string
  risk: string
  reviewLink: string
}

function SlackMessagePreview({ preview }: { preview: SlackPreview }) {
  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-mono">
      <p className="text-gray-400 mb-2 font-sans font-medium text-[11px] uppercase tracking-wide">Preview — what reviewers would see in Slack</p>
      <div className="border-l-4 border-[#4A154B] pl-3 space-y-1.5">
        <p className="font-semibold text-gray-900">RFP review needed: {preview.topic}</p>
        <div>
          <p className="text-gray-500">Question</p>
          <p className="text-gray-800">{preview.question}</p>
        </div>
        <div>
          <p className="text-gray-500">AI Draft Summary</p>
          <p className="text-gray-800">{preview.summary}</p>
        </div>
        <div className="flex gap-4 text-gray-600">
          <span>Confidence: {preview.confidence}</span>
          <span>Risk: {preview.risk}</span>
        </div>
        <div>
          <span className="inline-block bg-[#4A154B] text-white px-2 py-0.5 rounded text-[11px] font-sans">
            Review &amp; Approve →
          </span>
        </div>
      </div>
    </div>
  )
}

const PLATFORM_CONFIG = {
  resend: {
    label: 'Email (Resend)',
    description: 'Send email notifications to reviewers when RFP answers need review.',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 're_...' },
      { key: 'from_email', label: 'From Email', type: 'email', placeholder: 'rfp-agent@yourdomain.com' },
    ],
  },
  slack: {
    label: 'Slack (Webhooks)',
    description: 'Post review notifications to a Slack channel via incoming webhook.',
    fields: [
      { key: 'webhook_url', label: 'Default Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/services/...' },
    ],
  },
}

function IntegrationCard({ platform, existing }: { platform: 'resend' | 'slack'; existing?: Integration }) {
  const cfg = PLATFORM_CONFIG[platform]
  const [active, setActive] = useState(existing?.is_active ?? false)
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(cfg.fields.map((f) => [f.key, (existing?.settings?.[f.key] as string) ?? ''])),
  )
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [slackPreview, setSlackPreview] = useState<SlackPreview | null>(null)

  async function save() {
    setSaving(true)
    setMsg(null)
    setSlackPreview(null)
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, settings: fields, is_active: active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setMsg({ type: 'success', text: 'Saved successfully.' })
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  async function test() {
    setTesting(true)
    setMsg(null)
    setSlackPreview(null)
    try {
      const res = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Test failed')
      if (data.demo && data.preview) {
        setSlackPreview(data.preview as SlackPreview)
        setMsg({ type: 'success', text: 'Preview generated — this is what reviewers would see.' })
      } else {
        setMsg({ type: 'success', text: 'Test notification sent.' })
      }
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Test failed' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{cfg.label}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{cfg.description}</p>
        </div>
        <button
          onClick={() => setActive((v) => !v)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            active ? 'bg-blue-600' : 'bg-gray-200',
          )}
          role="switch"
          aria-checked={active}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              active ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      <div className="space-y-3">
        {cfg.fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input
              type={f.type}
              value={fields[f.key] ?? ''}
              onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {msg && (
        <p className={cn('mt-3 text-xs', msg.type === 'success' ? 'text-green-600' : 'text-red-600')}>
          {msg.text}
        </p>
      )}

      {slackPreview && <SlackMessagePreview preview={slackPreview} />}

      <div className="flex gap-2 mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={test}
          disabled={testing || !active}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
        >
          {testing ? 'Testing…' : 'Test'}
        </button>
      </div>
    </div>
  )
}

export function IntegrationPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/integrations')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setIntegrations(data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {(['resend', 'slack'] as const).map((platform) => (
        <IntegrationCard
          key={platform}
          platform={platform}
          existing={integrations.find((i) => i.platform === platform)}
        />
      ))}
    </div>
  )
}
