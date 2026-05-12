'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { RFPResponse } from '@/lib/schema'

type ReviewRequest = {
  id: string
  topic: string
  risk_level: string
  confidence_score: number | null
  assigned_to: string
  status: string
  due_at: string | null
  audit_log?: AuditEntry[]
  queries: {
    query_text: string
    rfp_context: Record<string, unknown> | null
    query_results: Array<{ answer: RFPResponse }> | null
  } | null
}

type Comment = {
  id: string
  author_email: string
  body: string
  created_at: string
}

type AuditEntry = {
  id: string
  actor_email: string
  action: string
  details: Record<string, unknown> | null
  created_at: string
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

const SUGGESTED_OWNER_LABEL: Record<string, string> = {
  product: 'Product',
  engineering: 'Engineering',
  commercial: 'Commercial',
  legal: 'Legal',
  customer: 'Customer Success',
  unknown: 'Unknown',
}

const SUGGESTED_OWNER_TOPIC: Record<string, string> = {
  product: 'general',
  engineering: 'technical',
  commercial: 'commercial',
  legal: 'legal',
  customer: 'support',
  unknown: 'general',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function initials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

const AUDIT_ICON: Record<string, string> = {
  approved: '✓',
  rejected: '✕',
  commented: '◎',
  escalated: '↑',
  assigned: '→',
}

function riskBadgeVariant(risk: string) {
  if (risk === 'high') return 'danger'
  if (risk === 'medium') return 'warn'
  return 'success'
}

function confColor(score: number | null): string {
  if (score === null) return 'var(--muted)'
  if (score >= 0.75) return 'var(--success)'
  if (score >= 0.60) return 'var(--warn)'
  return 'var(--danger)'
}

export function ReviewCard({ review }: { review: ReviewRequest }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editedAnswer, setEditedAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [ingestedToKB, setIngestedToKB] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [routingConfigs, setRoutingConfigs] = useState<Record<string, string>>({})

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [commentEmail, setCommentEmail] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [commentErr, setCommentErr] = useState<string | null>(null)

  // Audit log (from prop or loaded separately)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(review.audit_log ?? [])

  const answer = review.queries?.query_results?.[0]?.answer
  const questionText = review.queries?.query_text ?? ''
  const rfpTitle = (review.queries?.rfp_context?.rfp_title as string) ?? 'Untitled RFP'
  const draftAnswer = answer?.draft_answer ?? ''

  useEffect(() => {
    fetch(`/api/review/${review.id}/comments`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data) })
      .catch(() => null)

    if (!review.audit_log) {
      fetch(`/api/review/${review.id}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data.audit_log)) setAuditLog(data.audit_log) })
        .catch(() => null)
    }

    fetch('/api/admin/routing')
      .then((r) => r.json())
      .then((data: Array<{ topic: string; owner_email: string }>) => {
        if (Array.isArray(data)) {
          setRoutingConfigs(Object.fromEntries(data.map((c) => [c.topic, c.owner_email])))
        }
      })
      .catch(() => null)
  }, [review.id, review.audit_log])

  async function submit(action: 'approve' | 'reject') {
    setSubmitting(true)
    setErr(null)
    try {
      const res = await fetch(`/api/review/${review.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          edited_answer: editing && editedAnswer.trim() ? editedAnswer.trim() : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      if (action === 'approve' && json.ingested) setIngestedToKB(true)
      setDone(action === 'approve' ? 'approved' : 'rejected')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  async function postComment() {
    if (!commentEmail.trim() || !commentBody.trim()) return
    setPostingComment(true)
    setCommentErr(null)
    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      author_email: commentEmail.trim(),
      body: commentBody.trim(),
      created_at: new Date().toISOString(),
    }
    setComments((prev) => [...prev, optimistic])
    setCommentBody('')
    try {
      const res = await fetch(`/api/review/${review.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_email: commentEmail.trim(), body: optimistic.body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to post')
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? data : c)))
      setAuditLog((prev) => [
        ...prev,
        { id: data.id, actor_email: commentEmail.trim(), action: 'commented', details: null, created_at: data.created_at },
      ])
    } catch (e) {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id))
      setCommentBody(optimistic.body)
      setCommentErr(e instanceof Error ? e.message : 'Failed to post comment')
    } finally {
      setPostingComment(false)
    }
  }

  if (done) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
          {done === 'approved' ? 'Answer approved' : 'Answer rejected'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: ingestedToKB ? 8 : 24, lineHeight: 1.5 }}>
          {done === 'approved'
            ? 'The approved answer has been saved.'
            : 'The answer has been marked as rejected.'}
        </p>
        {ingestedToKB && (
          <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 24 }}>
            Saved to knowledge base
          </p>
        )}
        <button onClick={() => router.push('/review')} className="btn ghost sm">
          ← Back to queue
        </button>
      </div>
    )
  }

  if (review.status === 'approved' || review.status === 'rejected') {
    return (
      <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          This review has already been <strong>{review.status}</strong>.
        </p>
        <button onClick={() => router.push('/review')} className="btn ghost sm" style={{ marginTop: 16 }}>
          ← Back to queue
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="card card-pad" style={{ borderLeft: '3px solid var(--accent)', borderRadius: 'var(--r-md)' }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{rfpTitle}</p>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 10, lineHeight: 1.4 }}>
          {questionText}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{TOPIC_LABEL[review.topic] ?? review.topic}</span>
          <span className={`badge ${riskBadgeVariant(review.risk_level)} mono`}>
            {review.risk_level} risk
          </span>
          {review.confidence_score !== null && (
            <span style={{ fontSize: 12, fontWeight: 500, color: confColor(review.confidence_score) }}>
              {Math.round(review.confidence_score * 100)}% confidence
            </span>
          )}
          {review.assigned_to && (
            <span style={{ fontSize: 11.5, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>
              Assigned to {review.assigned_to}
            </span>
          )}
        </div>
      </div>

      {/* Executive summary */}
      {answer?.executive_summary && (
        <section className="card card-pad">
          <p className="eyebrow" style={{ marginBottom: 8 }}>Executive Summary</p>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{answer.executive_summary}</p>
        </section>
      )}

      {/* Draft answer */}
      <section className="card card-pad">
        <p className="eyebrow" style={{ marginBottom: 8 }}>AI Draft Answer</p>
        {editing ? (
          <textarea
            value={editedAnswer}
            onChange={(e) => setEditedAnswer(e.target.value)}
            rows={10}
            className="textarea"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
          />
        ) : (
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            padding: '14px 16px',
            fontSize: 13.5,
            color: 'var(--ink-2)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
          }}>
            {draftAnswer}
          </div>
        )}
      </section>

      {/* Citations */}
      {answer?.citations && answer.citations.length > 0 && (
        <section className="card card-pad">
          <p className="eyebrow" style={{ marginBottom: 10 }}>Citations ({answer.citations.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {answer.citations.map((c, i) => (
              <div key={i} className="cite">
                <p style={{ fontWeight: 500, fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 3 }}>{c.source_title}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.excerpt}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Missing info */}
      {answer?.missing_information && answer.missing_information.length > 0 && (
        <section className="card card-pad">
          <p className="eyebrow" style={{ marginBottom: 10 }}>Missing Information ({answer.missing_information.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {answer.missing_information.map((m, i) => {
              const ownerEmail = routingConfigs[SUGGESTED_OWNER_TOPIC[m.suggested_owner] ?? 'general']
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span className="badge ink mono" style={{ flexShrink: 0, fontSize: 11 }}>
                    {SUGGESTED_OWNER_LABEL[m.suggested_owner] ?? m.suggested_owner}
                  </span>
                  {ownerEmail && (
                    <span style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)', flexShrink: 0, paddingTop: 2 }}>
                      → {ownerEmail}
                    </span>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{m.item}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Confidence reasoning */}
      {answer?.confidence && (
        <section className="card card-pad">
          <p className="eyebrow" style={{ marginBottom: 6 }}>Confidence</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{answer.confidence.reason}</p>
        </section>
      )}

      {err && (
        <p style={{ fontSize: 13, color: 'var(--danger)', padding: '10px 14px', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', borderRadius: 'var(--r-sm)' }}>
          {err}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
        {editing ? (
          <>
            <button onClick={() => submit('approve')} disabled={submitting} className="btn accent">
              {submitting ? 'Saving…' : 'Save & Approve'}
            </button>
            <button onClick={() => { setEditing(false); setEditedAnswer('') }} disabled={submitting} className="btn ghost">
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => submit('approve')} disabled={submitting} className="btn accent">
              {submitting ? 'Saving…' : 'Approve'}
            </button>
            <button
              onClick={() => { setEditing(true); setEditedAnswer(draftAnswer) }}
              disabled={submitting}
              className="btn"
            >
              Edit & Approve
            </button>
            <button onClick={() => submit('reject')} disabled={submitting} className="btn danger">
              {submitting ? '…' : 'Reject'}
            </button>
          </>
        )}
      </div>

      {/* Discussion thread */}
      <section className="card card-pad">
        <p className="eyebrow" style={{ marginBottom: 14 }}>
          Discussion {comments.length > 0 && `(${comments.length})`}
        </p>

        {comments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-tint)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)',
                }}>
                  {initials(c.author_email)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                      {c.author_email}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{relativeTime(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="email"
            value={commentEmail}
            onChange={(e) => setCommentEmail(e.target.value)}
            placeholder="your@email.com"
            className="input"
            style={{ fontSize: 13 }}
          />
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            className="textarea"
            style={{ fontSize: 13, resize: 'vertical' }}
          />
          {commentErr && (
            <p style={{ fontSize: 12, color: 'var(--danger)' }}>{commentErr}</p>
          )}
          <div>
            <button
              onClick={postComment}
              disabled={postingComment || !commentEmail.trim() || !commentBody.trim()}
              className="btn sm"
            >
              {postingComment ? 'Posting…' : 'Add comment'}
            </button>
          </div>
        </div>
      </section>

      {/* Audit trail */}
      {auditLog.length > 0 && (
        <section className="card card-pad">
          <p className="eyebrow" style={{ marginBottom: 14 }}>Activity</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {auditLog.map((entry, i) => (
              <div key={entry.id} style={{ display: 'flex', gap: 12, paddingBottom: i < auditLog.length - 1 ? 14 : 0 }}>
                {/* Timeline line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: entry.action === 'approved'
                      ? 'var(--success-tint)'
                      : entry.action === 'rejected'
                      ? 'color-mix(in oklch, var(--danger) 10%, var(--surface))'
                      : entry.action === 'escalated'
                      ? 'var(--warn-tint)'
                      : 'var(--bg-tint)',
                    color: entry.action === 'approved'
                      ? 'var(--success)'
                      : entry.action === 'rejected'
                      ? 'var(--danger)'
                      : entry.action === 'escalated'
                      ? 'var(--warn)'
                      : 'var(--muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600,
                    border: '1px solid var(--border)',
                  }}>
                    {AUDIT_ICON[entry.action] ?? '·'}
                  </div>
                  {i < auditLog.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: 'var(--border)', minHeight: 12, marginTop: 3 }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{entry.actor_email}</span>
                    {' '}{entry.action === 'approved' && 'approved this review'}
                    {entry.action === 'rejected' && 'rejected this review'}
                    {entry.action === 'commented' && 'left a comment'}
                    {entry.action === 'escalated' && `escalated to ${(entry.details?.to as string) ?? 'backup reviewer'}`}
                    {!['approved','rejected','commented','escalated'].includes(entry.action) && entry.action}
                  </p>
                  <p style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 2 }}>{relativeTime(entry.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
