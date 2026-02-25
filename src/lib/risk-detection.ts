const RISK_KEYWORDS = [
  'lawyer',
  'sue',
  'suing',
  'lawsuit',
  'fraud',
  'scam',
  'illegal',
  'attorney',
  'court',
  'legal action',
  'report you',
  'consumer protection',
  'bbb',
  'better business bureau',
]

export function detectRisk(reviewText: string): boolean {
  if (!reviewText) return false
  const lowerText = reviewText.toLowerCase()
  return RISK_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

export function detectSentiment(rating: number): string {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}
