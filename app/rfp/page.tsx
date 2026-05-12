import { RFPProcessor } from '@/components/RFPProcessor'

export default function RFPPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">RFP Document Processor</h1>
        <p className="text-gray-500 text-base leading-relaxed">
          Upload a full RFP document. The agent will extract every requirement and draft a
          grounded response for each one — sourced from your knowledge base.
        </p>
      </div>
      <RFPProcessor />
    </div>
  )
}
