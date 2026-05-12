'use client'

import { useEffect, useState } from 'react'

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
    <div style={{ marginTop: 14, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--bg)', padding: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Preview — what reviewers would see in Slack</div>
      <div style={{ borderLeft: '3px solid #4A154B', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>RFP review needed: {preview.topic}</p>
        <div>
          <p className="eyebrow" style={{ marginBottom: 3 }}>Question</p>
          <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{preview.question}</p>
        </div>
        <div>
          <p className="eyebrow" style={{ marginBottom: 3 }}>AI Draft Summary</p>
          <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{preview.summary}</p>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
          <span>Confidence: {preview.confidence}</span>
          <span>Risk: {preview.risk}</span>
        </div>
        <div>
          <span style={{ display: 'inline-block', background: '#4A154B', color: 'white', padding: '3px 10px', borderRadius: 4, fontSize: 11.5, fontFamily: 'var(--font-sans)' }}>
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
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 13.5 }}>{cfg.label}</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>{cfg.description}</p>
        </div>
        <button
          onClick={() => setActive((v) => !v)}
          style={{
            position: 'relative',
            display: 'inline-flex',
            height: 20,
            width: 36,
            flexShrink: 0,
            cursor: 'pointer',
            borderRadius: 999,
            border: 'none',
            background: active ? 'var(--accent)' : 'var(--border-strong)',
            transition: 'background 200ms',
            padding: 0,
          }}
          role="switch"
          aria-checked={active}
        >
          <span
            style={{
              display: 'inline-block',
              height: 16,
              width: 16,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'transform 200ms',
              transform: active ? 'translateX(18px)' : 'translateX(2px)',
              margin: '2px 0',
            }}
          />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cfg.fields.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input
              type={f.type}
              value={fields[f.key] ?? ''}
              onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="input"
            />
          </div>
        ))}
      </div>

      {msg && (
        <p style={{ marginTop: 10, fontSize: 12, color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
          {msg.text}
        </p>
      )}

      {slackPreview && <SlackMessagePreview preview={slackPreview} />}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={save} disabled={saving} className="btn primary sm">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={test} disabled={testing || !active} className="btn sm">
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

  if (loading) return <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading…</p>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
