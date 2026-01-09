/**
 * Grok API Client
 *
 * xAI's Grok API is compatible with OpenAI's API format.
 * API endpoint: https://api.x.ai/v1
 *
 * Environment variable required: GROK_API_KEY
 */

interface GrokMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GrokChatRequest {
  model: string
  messages: GrokMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

interface GrokChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface GrokVisionRequest {
  model: string
  messages: {
    role: 'user'
    content: (
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    )[]
  }[]
  max_tokens?: number
}

const GROK_API_BASE = 'https://api.x.ai/v1'
const DEFAULT_MODEL = 'grok-2-latest'
const VISION_MODEL = 'grok-2-vision-1212'

class GrokClient {
  private apiKey: string | undefined

  constructor() {
    this.apiKey = process.env.GROK_API_KEY
  }

  private get isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Send a chat completion request to Grok
   */
  async chat(options: {
    messages: GrokMessage[]
    temperature?: number
    maxTokens?: number
    model?: string
  }): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Grok API key not configured. Set GROK_API_KEY environment variable.')
    }

    const request: GrokChatRequest = {
      model: options.model || DEFAULT_MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 500,
      stream: false,
    }

    const response = await fetch(`${GROK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Grok API error (${response.status}): ${error}`)
    }

    const data = (await response.json()) as GrokChatResponse
    return data.choices[0]?.message?.content || ''
  }

  /**
   * Process an image using Grok Vision
   */
  async vision(options: {
    imageBase64: string
    prompt: string
    mimeType?: string
    maxTokens?: number
  }): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Grok API key not configured. Set GROK_API_KEY environment variable.')
    }

    const mimeType = options.mimeType || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${options.imageBase64}`

    const request: GrokVisionRequest = {
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: options.prompt },
          ],
        },
      ],
      max_tokens: options.maxTokens ?? 1000,
    }

    const response = await fetch(`${GROK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Grok Vision API error (${response.status}): ${error}`)
    }

    const data = (await response.json()) as GrokChatResponse
    return data.choices[0]?.message?.content || ''
  }

  /**
   * Check if the Grok API is available
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured) return false

    try {
      const response = await this.chat({
        messages: [{ role: 'user', content: 'Say "ok"' }],
        maxTokens: 10,
      })
      return response.toLowerCase().includes('ok')
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const grokClient = new GrokClient()

// Export class for testing
export { GrokClient }
