'use client'

import { useState } from 'react'
import { DocumentList } from '@/components/DocumentList'
import { DocumentUpload } from '@/components/DocumentUpload'
import { SampleDataLoader } from '@/components/SampleDataLoader'

export default function DocumentsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  function handleNewDoc() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your indexed knowledge base. Documents are chunked and embedded for semantic search.
        </p>
      </div>

      {/* Two-column upload area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Upload a document</h2>
          <DocumentUpload onSuccess={handleNewDoc} />
        </div>
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Load sample dataset</h2>
          <SampleDataLoader onSuccess={handleNewDoc} />
        </div>
      </div>

      {/* Document list */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Indexed documents</h2>
        <DocumentList refreshKey={refreshKey} />
      </div>
    </div>
  )
}
