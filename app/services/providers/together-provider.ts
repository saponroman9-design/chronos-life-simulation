"use server"

import type {
  AIProvider,
  AIOptions,
  AITextResult,
  AIImageResult,
  AIAudioResult,
  ProviderConfig,
} from "../ai-provider.interface"

export class TogetherProvider implements AIProvider {
  private apiKey: string
  private config: ProviderConfig

  constructor(apiKey: string, config: ProviderConfig) {
    this.apiKey = apiKey
    this.config = config
  }

  getName(): string {
    return this.config.name
  }

  getType(): "native" | "gateway" {
    return this.config.type
  }

  async generateText(
    systemPrompt: string,
    history: Array<{ role: string; content: string }>,
    input: string,
    options?: AIOptions,
  ): Promise<AITextResult> {
    try {
      const model = options?.model || "deepseek-ai/DeepSeek-R1"

      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: input },
      ]

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Together AI error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || ""

      return {
        success: true,
        text,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      console.error("[Together AI] Text generation error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async generateImage(prompt: string, _options?: AIOptions): Promise<AIImageResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell",
          prompt,
          width: 1024,
          height: 1024,
          steps: 4,
          n: 1,
        }),
      })

      if (!response.ok) {
        throw new Error(`Together AI image error: ${response.status}`)
      }

      const data = await response.json()
      const imageUrl = data.data?.[0]?.url

      if (imageUrl) {
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64 = Buffer.from(imageBuffer).toString("base64")

        return { success: true, image: base64 }
      }

      return { success: false, error: "No image URL returned" }
    } catch (error) {
      console.error("[Together AI] Image generation error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async generateAudio(_text: string, _options?: AIOptions): Promise<AIAudioResult> {
    return {
      success: false,
      error: "Audio generation not supported by Together AI",
    }
  }

  getTextModels(): string[] {
    return this.config.models.text
  }

  getImageModels(): string[] {
    return this.config.models.image || []
  }

  getAudioModels(): string[] {
    return []
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
