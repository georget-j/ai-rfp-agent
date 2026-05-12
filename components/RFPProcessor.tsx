'use client'

import { useRef, useState } from 'react'
import { ConfidenceBadge } from './ConfidenceBadge'
import { ErrorAlert } from './ErrorAlert'
import type { ExtractedQuestion } from '@/lib/rfp-extract'
import type { RFPResponse, RetrievedChunk } from '@/lib/schema'
import type { BatchItem } from '@/lib/export-docx'

type AnsweredQuestion = {
  question_id: number
  question_text: string
  section: string
  response: RFPResponse
  retrieved_chunks: RetrievedChunk[]
}

type Step = 'upload' | 'reviewing' | 'answering' | 'done'

export function RFPProcessor() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rfpTitle, setRfpTitle] = useState('')

  const [questions, setQuestions] = useState<ExtractedQuestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const [answers, setAnswers] = useState<Map<number, AnsweredQuestion>>(new Map())
  const [answering, setAnswering] = useState<Set<number>>(new Set())
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const [exporting, setExporting] = useState(false)

  // ── Step 1: Upload & extract ──────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      setError('File too large — maximum upload size is 4 MB. Try compressing the PDF or saving as plain text.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setError(null)
    setExtracting(true)
    setRfpTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/rfp/extract', { method: 'POST', body: formData })
      const text = await res.text()
      let data: { error?: string; questions?: ExtractedQuestion[] }
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(
          res.ok ? 'Unexpected response from server' : `Server error ${res.status} — try again`
        )
      }
      if (!res.ok) throw new Error(data.error ?? 'Extraction failed')

      const extracted: ExtractedQuestion[] = data.questions ?? []
      setQuestions(extracted)
      setSelected(new Set(extracted.map((q) => q.id)))
      setStep('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Step 2: Review ────────────────────────────────────────────────────────

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function removeQuestion(id: number) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // ── Step 3: Batch answering ───────────────────────────────────────────────

  async function handleAnswerAll() {
    const toAnswer = questions.filter((q) => selected.has(q.id))
    if (toAnswer.length === 0) return

    setAnswers(new Map())
    setAnswering(new Set(toAnswer.map((q) => q.id)))
    setProgress({ done: 0, total: toAnswer.length })
    setStep('answering')

    try {
      const res = await fetch('/api/rfp/answer-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: toAnswer }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Batch answering failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const messages = buffer.split('\n\n')
        buffer = messages.pop() ?? ''

        for (const msg of messages) {
          if (!msg.startsWith('data: ')) continue
          const event = JSON.parse(msg.slice(6))

          if (event.type === 'result') {
            setAnswers((prev) => {
              const next = new Map(prev)
              next.set(event.question_id, event as AnsweredQuestion)
              return next
            })
            setAnswering((prev) => {
              const next = new Set(prev)
              next.delete(event.question_id)
              return next
            })
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
          } else if (event.type === 'question_error') {
            setAnswering((prev) => {
              const next = new Set(prev)
              next.delete(event.question_id)
              return next
            })
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
          } else if (event.type === 'done') {
            setStep('done')
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('reviewing')
    }
  }

  // ── Export all ────────────────────────────────────────────────────────────

  async function handleExportAll() {
    const items: BatchItem[] = Array.from(answers.values()).map((a) => ({
      section: a.section,
      question: a.question_text,
      response: a.response,
    }))

    setExporting(true)
    try {
      const res = await fetch('/api/export/rfp-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfpTitle, items }),
      })
      if (!res.ok) {
        const msg = await res.text().then((t) => { try { return JSON.parse(t).error } catch { return null } })
        throw new Error(msg ?? `Export failed (${res.status})`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${rfpTitle || 'rfp'}-responses.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const sectionGroups = questions.reduce<Record<string, ExtractedQuestion[]>>((acc, q) => {
    const arr = acc[q.section] ?? []
    arr.push(q)
    acc[q.section] = arr
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Step 1 — Upload */}
      {step === 'upload' && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.html"
            className="hidden"
            onChange={handleFileChange}
          />
          {extracting ? (
            <div className="space-y-3">
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">Analysing RFP document…</p>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-3">📄</div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Upload your RFP document
              </p>
              <p className="text-xs text-gray-400">PDF, DOCX, TXT, HTML — up to 4 MB</p>
            </>
          )}
        </div>
      )}

      {/* Step 2 — Review extracted questions */}
      {(step === 'reviewing' || step === 'answering' || step === 'done') && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{rfpTitle}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {questions.length} requirement{questions.length !== 1 ? 's' : ''} extracted
                {selected.size < questions.length && ` · ${selected.size} selected`}
              </p>
            </div>
            {step === 'reviewing' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(new Set(questions.map((q) => q.id)))}
                  className="text-xs text-gray-500 hover:text-gray-800 underline"
                >
                  Select all
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-800 underline"
                >
                  Deselect all
                </button>
                <button
                  onClick={handleAnswerAll}
                  disabled={selected.size === 0}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  Answer {selected.size} requirement{selected.size !== 1 ? 's' : ''}
                </button>
              </div>
            )}
            {step === 'answering' && (
              <div className="flex items-center gap-3">
                <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {progress.done} / {progress.total}
                </span>
              </div>
            )}
            {step === 'done' && (
              <button
                onClick={handleExportAll}
                disabled={exporting}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {exporting ? 'Exporting…' : '⬇ Export all as Word'}
              </button>
            )}
          </div>

          {/* Question groups by section */}
          <div className="space-y-4">
            {Object.entries(sectionGroups).map(([section, qs]) => (
              <div key={section} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {section}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {qs.map((q) => {
                    const answer = answers.get(q.id)
                    const isInProgress = answering.has(q.id)
                    const isPending = step === 'answering' && !answer && !isInProgress
                    return (
                      <div key={q.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {step === 'reviewing' && (
                            <input
                              type="checkbox"
                              checked={selected.has(q.id)}
                              onChange={() => toggleSelect(q.id)}
                              className="mt-0.5 rounded border-gray-300 shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
                            {answer && (
                              <div className="mt-2 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <ConfidenceBadge confidence={answer.response.confidence} />
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                  {answer.response.executive_summary}
                                </p>
                              </div>
                            )}
                            {isInProgress && (
                              <div className="mt-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-xs text-gray-400">Generating…</span>
                              </div>
                            )}
                            {isPending && (
                              <p className="mt-1 text-xs text-gray-300">Queued…</p>
                            )}
                          </div>
                          {step === 'reviewing' && (
                            <button
                              onClick={() => removeQuestion(q.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors text-xs shrink-0"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {step === 'reviewing' && (
            <button
              onClick={() => {
                setStep('upload')
                setQuestions([])
                setSelected(new Set())
                setAnswers(new Map())
              }}
              className="text-xs text-gray-400 hover:text-gray-700 underline"
            >
              ← Upload a different document
            </button>
          )}
        </div>
      )}
    </div>
  )
}
