"use server"

import type {
  AIProvider,
  AIOptions,
  AITextResult,
  AIImageResult,
  AIAudioResult,
  ProviderConfig,
} from "../ai-provider.interface"

export class ClaudeProvider implements AIProvider {
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
      const model = options?.model || "claude-3-5-sonnet-20241022"

      const messages = [
        ...history.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
        { role: "user", content: input },
      ]

      const response = await fetch(`${this.config.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: options?.maxTokens || 2000,
          temperature: options?.temperature || 0.7,
          system: systemPrompt,
          messages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      const text = data.content?.[0]?.text || ""

      return {
        success: true,
        text,
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      }
    } catch (error) {
      console.error("[Claude] Text generation error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async generateImage(_prompt: string, _options?: AIOptions): Promise<AIImageResult> {
    return {
      success: false,
      error: "Image generation not supported by Claude",
    }
  }

  async generateAudio(_text: string, _options?: AIOptions): Promise<AIAudioResult> {
    return {
      success: false,
      error: "Audio generation not supported by Claude",
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
      const response = await fetch(`${this.config.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1,
          messages: [{ role: "user", content: "test" }],
        }),
      })
      return response.ok || response.status === 400
    } catch {
      return false
    }
  }
}
