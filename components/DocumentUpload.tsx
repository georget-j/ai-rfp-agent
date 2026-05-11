'use client'

import { useState, useRef } from 'react'
import { ErrorAlert } from './ErrorAlert'

interface DocumentUploadProps {
  onSuccess?: (result: { title: string; chunk_count: number }) => void
}

const ACCEPT = '.txt,.md,.pdf,.docx,.csv,.xlsx,.html,.htm,.json'

const FORMAT_CHIPS = [
  { label: 'TXT',  className: 'bg-gray-100 text-gray-600' },
  { label: 'MD',   className: 'bg-gray-100 text-gray-600' },
  { label: 'PDF',  className: 'bg-blue-50 text-blue-600' },
  { label: 'DOCX', className: 'bg-blue-50 text-blue-600' },
  { label: 'CSV',  className: 'bg-green-50 text-green-700' },
  { label: 'XLSX', className: 'bg-green-50 text-green-700' },
  { label: 'HTML', className: 'bg-purple-50 text-purple-700' },
  { label: 'JSON', className: 'bg-purple-50 text-purple-700' },
]

export function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    setSuccess(null)
    setWarnings([])

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setSuccess(`"${data.title}" indexed — ${data.chunk_count} chunks`)
      if (data.warnings?.length) setWarnings(data.warnings)
      onSuccess?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    uploadFile(files[0])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm text-gray-600">
          {uploading ? 'Processing…' : 'Drop a file here or click to browse'}
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center mt-3">
          {FORMAT_CHIPS.map((chip) => (
            <span
              key={chip.label}
              className={`px-2 py-0.5 rounded text-xs font-medium ${chip.className}`}
            >
              {chip.label}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">max 5 MB</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {warnings.map((w, i) => (
        <div key={i} className="rounded border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-sm text-amber-700">{w}</p>
        </div>
      ))}

      {success && (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-2.5">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
    </div>
  )
}
