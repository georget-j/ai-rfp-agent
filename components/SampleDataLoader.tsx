'use client'

import { useState } from 'react'
import { LoadingDots } from './LoadingState'
import { ErrorAlert } from './ErrorAlert'

interface SampleDataLoaderProps {
  onSuccess?: () => void
}

export function SampleDataLoader({ onSuccess }: SampleDataLoaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ seeded: string[]; skipped: string[] } | null>(null)

  async function handleLoad() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/documents/seed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Seeding failed')
      setResult(data)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">Sample Dataset</h3>
        <p className="text-xs text-blue-700 mb-3">
          Load 8 pre-built enterprise documents including case studies, security notes, and an RFP answer library.
          No API key required for this step.
        </p>
        <button
          onClick={handleLoad}
          disabled={loading}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingDots />
              <span>Ingesting documents…</span>
            </>
          ) : (
            'Load Sample Documents'
          )}
        </button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {result && (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3">
          {result.seeded.length > 0 && (
            <p className="text-sm text-green-700">
              ✓ Ingested {result.seeded.length} document{result.seeded.length !== 1 ? 's' : ''}
            </p>
          )}
          {result.skipped.length > 0 && (
            <p className="text-xs text-green-600 mt-0.5">
              {result.skipped.length} already indexed — skipped
            </p>
          )}
          {result.seeded.length === 0 && result.skipped.length > 0 && (
            <p className="text-sm text-green-700">All sample documents are already indexed.</p>
          )}
        </div>
      )}
    </div>
  )
}
