export interface AIOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  [key: string]: unknown
}

export interface AITextResult {
  success: boolean
  text?: string
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIImageResult {
  success: boolean
  image?: string // base64 encoded
  error?: string
}

export interface AIAudioResult {
  success: boolean
  audio?: string // base64 encoded wav
  error?: string
}

export interface AIProvider {
  getName(): string
  getType(): "native" | "gateway"

  // Text generation
  generateText(
    systemPrompt: string,
    history: Array<{ role: string; content: string }>,
    input: string,
    options?: AIOptions,
  ): Promise<AITextResult>

  // Image generation (if supported)
  generateImage(prompt: string, options?: AIOptions): Promise<AIImageResult>

  // Audio/TTS generation (if supported)
  generateAudio(text: string, options?: AIOptions): Promise<AIAudioResult>

  // Available models
  getTextModels(): string[]
  getImageModels(): string[]
  getAudioModels(): string[]

  // Health check
  isAvailable(): Promise<boolean>
}

export interface ProviderConfig {
  name: string
  type: "native" | "gateway"
  baseUrl: string
  envKey: string
  models: {
    text: string[]
    image: string[] | null
    audio: string[] | null
  }
  rateLimits?: {
    rpm: number // requests per minute
    tpm: number // tokens per minute
  }
}
