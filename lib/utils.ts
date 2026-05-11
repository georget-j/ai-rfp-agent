export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function truncate(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
}

export function similarityToPercent(similarity: number) {
  return Math.round(similarity * 100)
}
