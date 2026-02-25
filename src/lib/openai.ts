import OpenAI from 'openai'

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'placeholder',
  })
}

export interface GenerateResponseParams {
  reviewText: string
  rating: number
  brandVoiceProfile: string
  reviewerName: string
  riskFlag: boolean
  companyName: string
  niche: string
}

export async function generateReviewResponse(params: GenerateResponseParams) {
  const {
    reviewText,
    rating,
    brandVoiceProfile,
    reviewerName,
    riskFlag,
    companyName,
    niche,
  } = params

  const isSafeMode = riskFlag || rating <= 3

  const systemPrompt = `You are an expert at writing unique, human, and professional review responses for high-ticket service companies. 
Your responses should:
- Sound genuinely personal and NOT like a template
- Match the company's brand voice
- Be concise (2-4 sentences for positive reviews, 4-6 for negative)
- Never use generic phrases like "Thank you for your feedback" or "We appreciate your review"
- NEVER admit liability or make promises you can't keep
${isSafeMode ? `
SAFE MODE ACTIVE - This is a sensitive review. Follow these rules strictly:
1. Acknowledge the reviewer's experience without admitting fault
2. Express understanding and empathy
3. Invite them to contact you offline to resolve the issue
4. Do NOT make any admissions of liability
5. Do NOT make specific promises
6. Keep it professional and de-escalating
` : ''}`

  const userPrompt = `Company: ${companyName}
Industry/Niche: ${niche || 'Service business'}
Brand Voice: ${brandVoiceProfile || 'Professional, warm, and trustworthy'}
Reviewer Name: ${reviewerName || 'Customer'}
Rating: ${rating}/5 stars
Review Text: "${reviewText}"

Write a response to this review. Make it unique and human. Do not start with "Thank you".`

  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 300,
  })

  const draft = response.choices[0].message.content || ''
  const tokensUsed = response.usage?.total_tokens || 0
  const costEstimate = ((response.usage?.prompt_tokens || 0) * 0.00015 + (response.usage?.completion_tokens || 0) * 0.0006) / 1000

  return { draft, tokensUsed, costEstimate }
}
