export const EXT_CLASSES: Record<string, string> = {
  txt:  'bg-gray-100 text-gray-600',
  md:   'bg-gray-100 text-gray-600',
  pdf:  'bg-blue-50 text-blue-600',
  docx: 'bg-blue-50 text-blue-600',
  csv:  'bg-green-50 text-green-700',
  xlsx: 'bg-green-50 text-green-700',
  html: 'bg-purple-50 text-purple-700',
  htm:  'bg-purple-50 text-purple-700',
  json: 'bg-purple-50 text-purple-700',
}

export function fileBadge(fileName: string | null): { label: string; className: string } | null {
  if (!fileName) return null
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const className = EXT_CLASSES[ext]
  if (!className) return null
  return { label: ext.toUpperCase(), className }
}
