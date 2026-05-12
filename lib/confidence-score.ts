import type { RFPResponse } from './schema'

export const ROUTING_THRESHOLD = 0.60
export const FLAG_THRESHOLD = 0.75

export function computeConfidenceScore(response: RFPResponse): number {
  const base = { high: 0.85, medium: 0.65, low: 0.45 }[response.confidence.level]

  const strongCount = response.supporting_evidence.filter((e) => e.strength === 'strong').length
  const bonus = Math.min(strongCount * 0.03, 0.10)

  const missingPenalty = Math.min(response.missing_information.length * 0.05, 0.20)

  const allWeak =
    response.supporting_evidence.length > 0 &&
    response.supporting_evidence.every((e) => e.strength === 'weak')
  const weakPenalty = allWeak ? 0.05 : 0

  return Math.max(0, Math.min(1, base + bonus - missingPenalty - weakPenalty))
}

export function shouldRoute(score: number, riskLevel: string): boolean {
  return score < FLAG_THRESHOLD || riskLevel === 'high'
}

export function isOptionalReview(score: number, riskLevel: string): boolean {
  return score >= ROUTING_THRESHOLD && score < FLAG_THRESHOLD && riskLevel !== 'high'
}

export function shouldFlag(score: number): boolean {
  return score < FLAG_THRESHOLD
}
