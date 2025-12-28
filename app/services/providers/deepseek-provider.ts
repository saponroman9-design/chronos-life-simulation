"use server"

import type {
  AIProvider,
  AIOptions,
  AITextResult,
  AIImageResult,
  AIAudioResult,
  ProviderConfig,
} from "../ai-provider.interface"

export class DeepSeekProvider implements AIProvider {
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
      const model = options?.model || "deepseek-chat"

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
        throw new Error(`DeepSeek API error: ${response.status}`)
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
      console.error("[DeepSeek] Text generation error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async generateImage(_prompt: string, _options?: AIOptions): Promise<AIImageResult> {
    return {
      success: false,
      error: "Image generation not supported by DeepSeek",
    }
  }

  async generateAudio(_text: string, _options?: AIOptions): Promise<AIAudioResult> {
    return {
      success: false,
      error: "Audio generation not supported by DeepSeek",
    }
  }

  getTextModels(): string[] {
    return this.config.models.text
  }

  getImageModels(): string[] {
    return []
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
