export type ExtractionResult = {
  text: string
  title: string
  warnings: string[]
  pageCount?: number
  wordCount?: number
}

export type ExtractorFn = (buffer: Buffer, fileName: string) => Promise<ExtractionResult>
