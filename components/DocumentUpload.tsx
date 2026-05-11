'use client'

import { useState, useRef } from 'react'
import { ErrorAlert } from './ErrorAlert'

interface DocumentUploadProps {
  onSuccess?: (result: { title: string; chunk_count: number }) => void
}

export function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    setSuccess(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setSuccess(`"${data.title}" indexed — ${data.chunk_count} chunks`)
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
          accept=".txt,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm text-gray-600">
          {uploading ? 'Processing…' : 'Drop a file here or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          .txt and .md files supported — max 5MB
        </p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {success && (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-2.5">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
    </div>
  )
}
